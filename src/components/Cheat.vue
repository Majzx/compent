<template>
    <div class="chat-app">
        <!-- <div class="app-header">
            <h1><i class="fas fa-robot"></i> AI智能聊天助手</h1>
            <p>随时为您解答问题，提供专业建议</p>
        </div> -->

        <!-- 欢迎消息 -->
        <div class="chat-container" ref="chatContainer">
            <!-- <div class="welcome-message">
                <h2>欢迎使用AI聊天助手</h2>
                <p>我是您的智能助手，可以回答各种问题、提供建议、帮助您解决问题。请随时向我提问！</p>

                <div class="features">
                    <div class="feature-card">
                        <i class="fas fa-lightbulb"></i>
                        <h3>创意灵感</h3>
                        <p>激发您的创造力</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-book"></i>
                        <h3>知识解答</h3>
                        <p>提供准确的信息</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-comments"></i>
                        <h3>自然对话</h3>
                        <p>流畅的交流体验</p>
                    </div>
                </div>
            </div> -->

            <!-- 消息列表 -->
            <div v-for="(message, index) in messages" :key="index">
                <div :class="message.sender === 'user' ? 'chat-message-user' : 'chat-message-ai'">
                    <div class="message-head-portrait">
                        <div v-if="message.sender === 'user'" class="avatar">
                            <img src="@/assets/icon/avatar.png" alt="">

                        </div>
                        <div v-else class="avatar">
                            <img src="@/assets/icon/AI.jpg" alt="">
                        </div>
                    </div>

                    <div
                        :class="message.sender === 'user' ? 'message-content message-user' : 'message-content message-ai'">
                        <div class="sender-name" :class="{ 'sender-name-user': message.sender === 'user' }">
                            {{ message.sender === 'user' ? '我' : 'AI助手' }}
                        </div>
                        <div class="message-bubble">
                            {{ message.content }}
                            <!--  时间戳 -->
                            <div class="timestamp">{{ message.time }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 输入中指示器 -->
            <div class="typing-indicator" v-if="isTyping">
                <span></span>
                <span></span>
                <span></span>
            </div>
            
            
        </div>

        <!-- 输入框和按钮 -->
        <div class="input-container">
            <input type="text" class="message-input" v-model="newMessage" placeholder="输入消息..."
                @keyup.enter="sendMessage">
            <button class="send-button" @click="sendMessage">
                发送
            </button>
        </div>
    </div>
</template>

<script>
// import axios from 'axios'
export default {
    name: 'AIChat',
    data () {
        return {
            newMessage: '',
            messages: [
                // { sender: 'user', content: '你好！', time: '12:00' },
                // { sender: 'AI', content: '你好！我是AI助手，有什么可以帮您的吗？', time: '12:01' },
                // { sender: 'user', content: '如何提高工作效率？', time: '12:02' },
                // { sender: 'AI', content: '提高工作效率可以尝试：\n1. 制定每日计划\n2. 避免多任务处理\n3. 设置专注时间段\n4. 定期休息\n5. 学会拒绝无关事务', time: '12:03' }
            ],
            isTyping: false
        }
    },
    methods: {
        sendMessage () {
            if (!this.newMessage.trim()) return;

            // 添加用户消息
            const userMsg = {
                sender: 'user',
                content: this.newMessage,
                time: this.getCurrentTime()
            };
            this.messages.push(userMsg);

            // 清空输入框
            const userInput = this.newMessage;
            this.newMessage = '';
            this.$nextTick(() => {
                this.scrollToBottom();
            });
            // 模拟AI回复
            this.isTyping = true;

            setTimeout(() => {
                this.isTyping = false;

                // 添加AI回复
                const aiMsg = {
                    sender: 'AI',
                    content: this.generateAIResponse(userInput),
                    time: this.getCurrentTime()
                };
                this.messages.push(aiMsg);

                // 滚动到底部
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            }, 1500);
        },
        getCurrentTime () {
            const now = new Date();
            return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        },
        generateAIResponse (input) {
            const responses = [
                `关于"${input}"，我的建议是：可以尝试使用番茄工作法，每工作25分钟休息5分钟，提高专注度。`,
                `您提到的"${input}"很重要！保持工作环境整洁、减少干扰也能有效提升效率。`,
                `"${input}"是很多人关心的问题。建议每天早上列出优先级最高的3件事，先完成最重要的任务。`,
                `对于"${input}"，工具也很重要。可以使用Notion、Trello等工具管理任务，减少记忆负担。`,
                `我理解您的需求是"${input}"。其实保持充足的睡眠和定期运动，也能从根本上提升工作效率哦！`
            ];

            return responses[Math.floor(Math.random() * responses.length)];
        },
        scrollToBottom () {
            const container = this.$refs.chatContainer;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    },
    mounted () {
        this.$nextTick(() => {
            this.scrollToBottom();
        });
    }
}
</script>

<style scoped>
/* 基础样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

body {
    background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
}

.chat-app {
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.app-header {
    background: linear-gradient(90deg, #4e54c8, #8f94fb);
    color: white;
    padding: 16px;
    text-align: center;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
    font-size: 1.2rem;
    margin-bottom: 4px;
}

.app-header p {
    font-size: 0.75rem;
    opacity: 0.9;
}

.chat-container {
    flex: 1;
    overflow-y: auto;
    background: #f5f7fb;
    position: relative;
    padding: 10px 0;
}

.chat-message-user,
.chat-message-ai {
    display: flex;
    margin-bottom: 16px;
    animation: fadeIn 0.5s ease forwards;
}

.chat-message-user {
    padding-right: 8px;
    flex-direction: row-reverse;
}

.chat-message-ai {
    padding-left: 8px;
}

.message-head-portrait {
    flex-shrink: 0;
    margin: 0 10px;
}

.avatar img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    font-size: 16px;
    font-weight: bold;
}


.message-content {
    max-width: 80%;
}

.sender-name {
    font-size: 11px;
    font-weight: 600;
    color: #6c757d;
    margin-bottom: 4px;
    padding: 0 6px;
}

.sender-name-user {
    text-align: right;
}

.message-bubble {
    padding: 10px 14px;
    border-radius: 14px;
    line-height: 1.5;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    font-size: 14px;
}

.message-user .message-bubble {
    background: linear-gradient(90deg, #4e54c8, #8f94fb);
    color: white;
    border-top-right-radius: 5px;
}

.message-ai .message-bubble {
    background: white;
    border-top-left-radius: 5px;
    color: #333;
}

.input-container {
    padding: 12px;
    background: white;
    border-top: 1px solid #eaeaea;
    display: flex;
    box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.03);
    position: sticky;
    bottom: 0;
    z-index: 10;
}

.message-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 24px;
    font-size: 14px;
    outline: none;
    transition: all 0.3s;
}

.message-input:focus {
    border-color: #8f94fb;
    box-shadow: 0 0 0 2px rgba(143, 148, 251, 0.2);
}

.send-button {
    margin-left: 10px;
    padding: 12px 18px;
    background: linear-gradient(90deg, #4e54c8, #8f94fb);
    color: white;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    box-shadow: 0 3px 10px rgba(78, 84, 200, 0.25);
    user-select: none;
}

.send-button:active {
    -webkit-tap-highlight-color: transparent;
    transform: translateY(2px);
}

.send-button i {
    margin-right: 6px;
}

.typing-indicator {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    width: fit-content;
    margin: 0 0 16px 56px;
}

.typing-indicator span {
    height: 6px;
    width: 6px;
    border-radius: 50%;
    background: #8f94fb;
    display: inline-block;
    margin: 0 2px;
    animation: typing 1.5s infinite;
}

.typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
}

.welcome-message {
    text-align: center;
    padding: 30px 16px;
    color: #6c757d;
}

.welcome-message h2 {
    margin-bottom: 12px;
    color: #4e54c8;
    font-size: 1.2rem;
}

.welcome-message p {
    max-width: 90%;
    margin: 0 auto 20px;
    font-size: 0.9rem;
    line-height: 1.5;
}

.features {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 20px;
    flex-wrap: wrap;
}

.feature-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    width: calc(50% - 10px);
    text-align: center;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s;
}

.feature-card:hover {
    transform: translateY(-5px);
}

.feature-card i {
    font-size: 1.5rem;
    color: #8f94fb;
    margin-bottom: 10px;
}

.feature-card h3 {
    margin-bottom: 6px;
    color: #4e54c8;
    font-size: 0.9rem;
}

.feature-card p {
    font-size: 0.75rem;
}

.timestamp {
    font-size: 9px;
    color: #d62525;
    margin-top: 4px;
    text-align: right;
}

/* 动画 */
@keyframes typing {

    0%,
    60%,
    100% {
        transform: translateY(0);
    }

    30% {
        transform: translateY(-3px);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes bubbleAppear {
    0% {
        transform: scale(0.5);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* 滚动条 */
.chat-container::-webkit-scrollbar {
    width: 4px;
}

.chat-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.chat-container::-webkit-scrollbar-thumb {
    background: #8f94fb;
    border-radius: 3px;
}

.chat-container::-webkit-scrollbar-thumb:hover {
    background: #4e54c8;
}

/* 屏幕极小时样式 */
@media (max-width: 360px) {
    .feature-card {
        width: 100%;
    }

    .message-bubble {
        font-size: 13px;
        padding: 8px 12px;
    }

    .app-header h1 {
        font-size: 1.1rem;
    }
}
</style>