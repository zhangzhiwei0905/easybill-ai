#!/bin/bash

# 测试 AI 解析失败的场景
# 用法: ./test-parse-error.sh

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
    -d '{"email":"18162628678@163.com","password":"123456789Aa."}')

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
echo -e "${BLUE}   AI 解析失败测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 测试用例 1: 完全无关的文本
echo -e "${YELLOW}1. 测试完全无关的文本（天气预报）${NC}"
echo "   发送内容: 明天北京天气晴朗，气温15-25度，适合外出游玩。"

WEATHER_RESPONSE=$(curl -s -X POST "${API_BASE}/ai-items/webhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"rawText\": \"明天北京天气晴朗，气温15-25度，适合外出游玩。\",
        \"userId\": \"${USER_ID}\",
        \"webhookKey\": \"${WEBHOOK_KEY}\"
    }")

echo "   响应:"
echo "$WEATHER_RESPONSE" | jq '.'
PARSE_ERROR=$(echo $WEATHER_RESPONSE | jq -r '.data.parseError // "无"')
CONFIDENCE=$(echo $WEATHER_RESPONSE | jq -r '.data.confidence')
echo -e "   解析错误: ${RED}${PARSE_ERROR}${NC}"
echo -e "   置信度: ${CONFIDENCE}"
echo ""

# 测试用例 2: 模糊不清的文本
echo -e "${YELLOW}2. 测试模糊不清的文本${NC}"
echo "   发送内容: 今天花了一些钱"

VAGUE_RESPONSE=$(curl -s -X POST "${API_BASE}/ai-items/webhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"rawText\": \"今天花了一些钱\",
        \"userId\": \"${USER_ID}\",
        \"webhookKey\": \"${WEBHOOK_KEY}\"
    }")

echo "   响应:"
echo "$VAGUE_RESPONSE" | jq '.'
PARSE_ERROR=$(echo $VAGUE_RESPONSE | jq -r '.data.parseError // "无"')
CONFIDENCE=$(echo $VAGUE_RESPONSE | jq -r '.data.confidence')
echo -e "   解析错误: ${RED}${PARSE_ERROR}${NC}"
echo -e "   置信度: ${CONFIDENCE}"
echo ""

# 测试用例 3: 验证码短信
echo -e "${YELLOW}3. 测试验证码短信${NC}"
echo "   发送内容: 【某平台】您的验证码是123456，5分钟内有效。"

CODE_RESPONSE=$(curl -s -X POST "${API_BASE}/ai-items/webhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"rawText\": \"【某平台】您的验证码是123456，5分钟内有效。\",
        \"userId\": \"${USER_ID}\",
        \"webhookKey\": \"${WEBHOOK_KEY}\"
    }")

echo "   响应:"
echo "$CODE_RESPONSE" | jq '.'
PARSE_ERROR=$(echo $CODE_RESPONSE | jq -r '.data.parseError // "无"')
CONFIDENCE=$(echo $CODE_RESPONSE | jq -r '.data.confidence')
echo -e "   解析错误: ${RED}${PARSE_ERROR}${NC}"
echo -e "   置信度: ${CONFIDENCE}"
echo ""

# 测试用例 4: 格式异常的银行短信
echo -e "${YELLOW}4. 测试格式异常的银行短信（缺少金额）${NC}"
echo "   发送内容: 【银行】您账户有一笔交易，请注意查收。"

MALFORMED_RESPONSE=$(curl -s -X POST "${API_BASE}/ai-items/webhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"rawText\": \"【银行】您账户有一笔交易，请注意查收。\",
        \"userId\": \"${USER_ID}\",
        \"webhookKey\": \"${WEBHOOK_KEY}\"
    }")

echo "   响应:"
echo "$MALFORMED_RESPONSE" | jq '.'
PARSE_ERROR=$(echo $MALFORMED_RESPONSE | jq -r '.data.parseError // "无"')
CONFIDENCE=$(echo $MALFORMED_RESPONSE | jq -r '.data.confidence')
echo -e "   解析错误: ${RED}${PARSE_ERROR}${NC}"
echo -e "   置信度: ${CONFIDENCE}"
echo ""

# 测试用例 5: 纯数字乱码
echo -e "${YELLOW}5. 测试纯数字乱码${NC}"
echo "   发送内容: 1234567890abcdef"

GIBBERISH_RESPONSE=$(curl -s -X POST "${API_BASE}/ai-items/webhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"rawText\": \"1234567890abcdef\",
        \"userId\": \"${USER_ID}\",
        \"webhookKey\": \"${WEBHOOK_KEY}\"
    }")

echo "   响应:"
echo "$GIBBERISH_RESPONSE" | jq '.'
PARSE_ERROR=$(echo $GIBBERISH_RESPONSE | jq -r '.data.parseError // "无"')
CONFIDENCE=$(echo $GIBBERISH_RESPONSE | jq -r '.data.confidence')
echo -e "   解析错误: ${RED}${PARSE_ERROR}${NC}"
echo -e "   置信度: ${CONFIDENCE}"
echo ""

# 查看所有待审核项中的错误信息
echo -e "${YELLOW}6. 查看所有待审核项（包含解析错误）${NC}"
LIST_RESPONSE=$(curl -s -X GET "${API_BASE}/ai-items?status=NEEDS_MANUAL" \
    -H "Authorization: Bearer ${TOKEN}")

echo "   待审核项列表:"
echo "$LIST_RESPONSE" | jq '.data.items[] | {id, rawText, parseError, confidence, status}'

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   测试完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "说明："
echo "- parseError 字段存储了解析失败的原因"
echo "- confidence 为 LOW 的记录通常需要人工确认"
echo "- 可以在前端 AI Audit 页面查看这些待审核项"
