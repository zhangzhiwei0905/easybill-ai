#!/bin/bash

# Webhook API 测试脚本（用户专属 Webhook Key 版本）
# 用法: ./test-webhook.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE="http://localhost:3000/api"

echo -e "${YELLOW}请先确保后端服务已启动: cd backend && npm run start:dev${NC}"
echo ""

# 登录获取 token 和用户信息
echo -e "${BLUE}正在登录获取用户信息...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"18162628678@163.com","password":"123456789Aa"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.id')
WEBHOOK_KEY=$(echo $LOGIN_RESPONSE | jq -r '.data.user.webhookKey')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}登录失败，请检查测试账号${NC}"
    echo "响应: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}登录成功！${NC}"
echo "   用户ID: ${USER_ID}"
echo "   Webhook Key: ${WEBHOOK_KEY}"
echo ""

# 如果没有 webhookKey，尝试获取
if [ "$WEBHOOK_KEY" == "null" ] || [ -z "$WEBHOOK_KEY" ]; then
    echo -e "${YELLOW}用户没有 Webhook Key，正在获取...${NC}"
    WEBHOOK_RESPONSE=$(curl -s -X GET "${API_BASE}/auth/webhook-key" \
        -H "Authorization: Bearer ${TOKEN}")
    WEBHOOK_KEY=$(echo $WEBHOOK_RESPONSE | jq -r '.data.webhookKey')
    echo "   Webhook Key: ${WEBHOOK_KEY}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   EasyBill AI - Webhook 接口测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 测试用例
echo -e "${YELLOW}1. 测试 Webhook 接口 - 解析银行短信${NC}"
echo "   发送短信: 【招商银行】您尾号8888的账户于02月27日14:30支出128.50元，商户名称:美团外卖。"

WEBHOOK_RESPONSE=$(curl -s -X POST "${API_BASE}/ai-items/webhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"rawText\": \"【招商银行】您尾号8888的账户于02月27日14:30支出128.50元，商户名称:美团外卖。\",
        \"userId\": \"${USER_ID}\",
        \"webhookKey\": \"${WEBHOOK_KEY}\"
    }")

echo "   响应:"
echo "$WEBHOOK_RESPONSE" | jq '.'

AI_ITEM_ID=$(echo $WEBHOOK_RESPONSE | jq -r '.data.id // empty')

if [ -z "$AI_ITEM_ID" ]; then
    echo -e "${RED}   Webhook 调用失败${NC}"
else
    echo -e "${GREEN}   Webhook 调用成功，AI Item ID: ${AI_ITEM_ID}${NC}"
fi

echo ""
echo -e "${YELLOW}2. 测试获取待审核列表${NC}"

LIST_RESPONSE=$(curl -s -X GET "${API_BASE}/ai-items" \
    -H "Authorization: Bearer ${TOKEN}")

echo "   响应:"
echo "$LIST_RESPONSE" | jq '.'

echo ""
echo -e "${YELLOW}3. 测试获取单个待审核项${NC}"

if [ -n "$AI_ITEM_ID" ]; then
    ITEM_RESPONSE=$(curl -s -X GET "${API_BASE}/ai-items/${AI_ITEM_ID}" \
        -H "Authorization: Bearer ${TOKEN}")

    echo "   响应:"
    echo "$ITEM_RESPONSE" | jq '.'

    # 获取分类ID用于确认入账
    CATEGORY_ID=$(echo $ITEM_RESPONSE | jq -r '.data.categoryId // empty')
    ITEM_TYPE=$(echo $ITEM_RESPONSE | jq -r '.data.type')
    ITEM_AMOUNT=$(echo $ITEM_RESPONSE | jq -r '.data.amount')
    ITEM_DATE=$(echo $ITEM_RESPONSE | jq -r '.data.parsedDate')
    ITEM_DESC=$(echo $ITEM_RESPONSE | jq -r '.data.description')
else
    echo -e "${RED}   跳过：没有可用的 AI Item ID${NC}"
fi

echo ""
echo -e "${YELLOW}4. 测试更新待审核项${NC}"

if [ -n "$AI_ITEM_ID" ]; then
    UPDATE_RESPONSE=$(curl -s -X PATCH "${API_BASE}/ai-items/${AI_ITEM_ID}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "description": "美团外卖（已修改）"
        }')

    echo "   响应:"
    echo "$UPDATE_RESPONSE" | jq '.'
else
    echo -e "${RED}   跳过：没有可用的 AI Item ID${NC}"
fi

echo ""
echo -e "${YELLOW}5. 测试确认入账${NC}"

if [ -n "$AI_ITEM_ID" ]; then
    # 如果没有分类ID，使用一个默认分类
    if [ -z "$CATEGORY_ID" ] || [ "$CATEGORY_ID" == "null" ]; then
        echo -e "${YELLOW}   获取餐饮分类ID...${NC}"
        CATEGORIES_RESPONSE=$(curl -s -X GET "${API_BASE}/categories?type=EXPENSE" \
            -H "Authorization: Bearer ${TOKEN}")
        CATEGORY_ID=$(echo $CATEGORIES_RESPONSE | jq -r '.data[0].id')
        echo "   使用分类ID: $CATEGORY_ID"
    fi

    CONFIRM_RESPONSE=$(curl -s -X POST "${API_BASE}/ai-items/${AI_ITEM_ID}/confirm" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"${ITEM_TYPE}\",
            \"amount\": ${ITEM_AMOUNT},
            \"description\": \"${ITEM_DESC}\",
            \"date\": \"${ITEM_DATE}\",
            \"categoryId\": \"${CATEGORY_ID}\"
        }")

    echo "   响应:"
    echo "$CONFIRM_RESPONSE" | jq '.'
else
    echo -e "${RED}   跳过：没有可用的 AI Item ID 或分类ID${NC}"
fi

echo ""
echo -e "${YELLOW}6. 测试更多短信样本${NC}"

# 测试收入短信
echo -e "${BLUE}   6.1 测试收入短信${NC}"
INCOME_RESPONSE=$(curl -s -X POST "${API_BASE}/ai-items/webhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"rawText\": \"【工商银行】您尾号6666的账户于02月28日10:00收入5000.00元，摘要:工资发放。\",
        \"userId\": \"${USER_ID}\",
        \"webhookKey\": \"${WEBHOOK_KEY}\"
    }")

echo "   响应:"
echo "$INCOME_RESPONSE" | jq '.'

# 测试转账短信
echo -e "${BLUE}   6.2 测试转账短信${NC}"
TRANSFER_RESPONSE=$(curl -s -X POST "${API_BASE}/ai-items/webhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"rawText\": \"【建设银行】您尾号9999的账户于02月28日15:30转账支出2000.00元，收款人:张三。\",
        \"userId\": \"${USER_ID}\",
        \"webhookKey\": \"${WEBHOOK_KEY}\"
    }")

echo "   响应:"
echo "$TRANSFER_RESPONSE" | jq '.'

echo ""
echo -e "${YELLOW}7. 测试重新生成 Webhook Key${NC}"

REGEN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/webhook-key/regenerate" \
    -H "Authorization: Bearer ${TOKEN}")

echo "   响应:"
echo "$REGEN_RESPONSE" | jq '.'

NEW_WEBHOOK_KEY=$(echo $REGEN_RESPONSE | jq -r '.data.webhookKey')
echo -e "${GREEN}   新的 Webhook Key: ${NEW_WEBHOOK_KEY}${NC}"
echo -e "${YELLOW}   注意：旧的 Webhook Key 已失效${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   测试完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "提示: 访问 http://localhost:3000/api/docs 查看 Swagger 文档"
echo ""
echo "Webhook 调用示例:"
echo "curl -X POST ${API_BASE}/ai-items/webhook \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"rawText\":\"【银行】支出100元\",\"userId\":\"${USER_ID}\",\"webhookKey\":\"<your-webhook-key>\"}'"
