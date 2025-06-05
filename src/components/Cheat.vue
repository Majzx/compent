<template>
    <div class="chat-app">
        <!-- 页面加载指示器 -->
        <div v-if="isLoadingApp" class="app-loading">
            <div class="loading-spinner"></div>
            <p>{{ ok ? '正在加载智慧养老助手...' : '智慧养老助手加载失败，请检查网络连接或联系管理员' }}</p>
        </div>

        <!-- 演示视频用,你可以替换成自己的导航栏 -->
        <div class="app-header">
            <div class="header-left">
                <button class="back-button">
                    <i>{{ '<' }}</i>
                </button>
            </div>
            <div class="header-center">
                <h1><i class="fas fa-robot"></i> 智慧养老助手</h1>
                <p>随时为您解答问题，提供专业建议</p>
            </div>
        </div>

        <div class="chat-container" ref="chatContainer">
            <!-- 消息列表 -->
            <div v-for="(message, index) in messages" :key="index">
                <div :class="message.sender === 'user' ? 'chat-message-user' : 'chat-message-ai'">
                    <div class="message-head-portrait">
                        <div v-if="message.sender === 'user'" class="avatar">
                            <img src="@/assets/icon/avatar.png" alt="">
                            <!-- 可以从vuex拿userInfo渲染用户头像 -->
                        </div>
                        <div v-else class="avatar">
                            <img src="@/assets/icon/AI.jpg" alt="">
                        </div>
                    </div>

                    <div
                        :class="message.sender === 'user' ? 'message-content message-user' : 'message-content message-ai'">
                        <div class="sender-name" :class="{ 'sender-name-user': message.sender === 'user' }">
                            {{ message.sender === 'user' ? '我' : 'AI助手' }}
                            <!-- 可以从vuex拿userInfo渲染用户名 -->
                        </div>
                        <div class="message-bubble">
                            {{ message.content }}
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

            <!-- 流式响应显示 -->
            <div v-if="isStreaming" class="streaming-message">
                <div class="message-head-portrait">
                    <div class="avatar">
                        <img src="@/assets/icon/AI.jpg" alt="">
                    </div>
                </div>

                <div class="message-content message-ai">
                    <div class="sender-name">AI助手</div>
                    <div class="message-bubble">
                        <div v-html="streamingContent"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 输入框和按钮 -->
        <div class="input-container">
            <input type="text" class="message-input" v-model="newMessage" placeholder="输入消息..."
                @keyup.enter="sendMessage" :disabled="isLoading">
            <button class="send-button" @click="sendMessage" :disabled="isLoading">
                发送
            </button>
        </div>
    </div>
</template>

<script>
import { fetchEventSource } from "@microsoft/fetch-event-source";

export default {
    name: "AIChat",
    data () {
        return {
            newMessage: "", // 输入框内容
            messages: [], // 消息列表
            isLoading: false, // 加载状态
            isStreaming: false, // 流式响应状态
            isTyping: false, // 输入中指示器状态
            streamingContent: "", // 流式响应内容
            controller: null, // 控制器
            errorDisplayed: false, // 错误提示状态
            hasReceivedData: false, // 标记是否已接收数据
            isLoadingApp: true, // 应用加载状态
            healthCheckTimeout: null, // 健康检查超时定时器
            appLoadTimeout: 3000, // 保底加载时间(毫秒)
            ok: true
        };
    },
    methods: {
        checkAppHealth () {
            const apiUrl = "http://10.138.50.151:8000/api/health";

            fetch(apiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`健康检查失败: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.status === "ok") {
                        this.handleHealthCheckSuccess();
                    } else {
                        throw new Error("健康检查返回非ok状态");
                    }
                })
                .catch(error => {
                    this.handleHealthCheckError(error);
                });
        },

        handleHealthCheckSuccess () {
            // 即使提前收到响应，也等待保底时间
            clearTimeout(this.healthCheckTimeout);
            this.healthCheckTimeout = setTimeout(() => {
                this.isLoadingApp = false;
            }, this.appLoadTimeout);
        },

        handleHealthCheckError (error) {
            console.error("健康检查错误:", error);
            clearTimeout(this.healthCheckTimeout);
            this.isLoadingApp = true; // 保持蒙版

            this.ok = false
            console.log('弹错误提示');
        },

        sendMessage () {
            let message = this.newMessage.trim();
            if (!this.newMessage.trim() || this.isLoading) return;

            // 重置状态
            this.errorDisplayed = false;
            this.streamingContent = "";
            this.hasReceivedData = false;
            this.isTyping = true; // 显示输入中指示器

            // 添加用户消息
            const userMsg = {
                sender: "user",
                content: this.newMessage,
                time: this.getCurrentTime(),
            };
            this.messages.push(userMsg);
            this.newMessage = "";

            // 清空输入框
            this.$nextTick(() => {
                this.scrollToBottom();
            });

            // 开始加载状态
            this.isLoading = true;


            // 取消之前的请求
            if (this.controller) {
                this.controller.abort();
            }

            // 创建新的控制器
            this.controller = new AbortController();
            const signal = this.controller.signal;

            // 发送SSE请求
            fetchEventSource("http://10.138.50.151:8000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_content: message }),
                signal,
                onmessage: (msg) => {
                    this.handleMessage(msg);
                },
                onerror: (err) => {
                    this.handleError(err);
                    this.controller.abort();
                    throw err
                },
                onclose: () => {
                    this.handleStreamClose();
                },
            });
        },

        handleMessage (msg) {
            if (!this.hasReceivedData) {
                this.isTyping = false; // 收到第一条数据后隐藏输入指示器
                this.isStreaming = true; // 显示流式响应
                this.hasReceivedData = true; // 标记已接收数据
            }

            try {
                const res = JSON.parse(msg.data);

                // 忽略无效内容
                if (!res.content || res.content === "undefined") {
                    return;
                }

                // 更新流式内容
                this.streamingContent += res.content;
                this.$nextTick(() => {
                    this.scrollToBottom();
                });

            } catch (error) {
                if (!this.errorDisplayed) {
                    this.errorDisplayed = true;
                    console.error("解析SSE消息失败:", error, msg.data);
                    this.addErrorMsg("抱歉，解析消息时发生错误。");
                }
            }
        },

        handleStreamClose () {
            this.isLoading = false;
            this.isStreaming = false;

            // 确保流式内容不为空时添加到消息列表
            if (this.streamingContent.trim()) {
                const aiMsg = {
                    sender: "AI",
                    content: this.streamingContent,
                    time: this.getCurrentTime(),
                };
                this.messages.push(aiMsg);
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            } else {
                // 处理空响应的情况
                if (!this.errorDisplayed) {
                    this.addErrorMsg("抱歉，未获取到有效响应。");
                }
            }
        },

        handleError (err) {
            this.isTyping = false; // 错误时隐藏输入指示器
            if (!this.errorDisplayed) {
                this.errorDisplayed = true;
                this.isLoading = false;
                this.isStreaming = false;
                console.error("SSE请求错误:", err);
                this.addErrorMsg("抱歉，请求处理失败，请稍后再试。");
            }
        },
        addErrorMsg (content) {
            const errorMsg = {
                sender: "AI",
                content,
                time: this.getCurrentTime(),
            };
            this.messages.push(errorMsg);
            this.$nextTick(() => {
                this.scrollToBottom();
            });
        },

        getCurrentTime () {
            const now = new Date();
            return `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
        },

        scrollToBottom () {
            const container = this.$refs.chatContainer;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        },
    },
    beforeDestroy () {
        if (this.controller) {
            this.controller.abort();
        }
        clearTimeout(this.healthCheckTimeout);
    },
    mounted () {
        this.checkAppHealth();
    },
};
</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.header-left {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
}

.header-center {
    flex: 1;
    text-align: center;
}

.back-button {
    background: none;
    border: none;
    color: white;
    font-size: 34px;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: background-color 0.3s;
}

.back-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.back-button:active {
    transform: scale(0.95);
}

.back-button i {
    margin: 0;
}

.app-header h1 {
    font-size: 1.2rem;
    margin-bottom: 4px;
}

.app-header p {
    font-size: 0.75rem;
    opacity: 0.9;
}

.app-loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #f5f7fb;
    z-index: 1000;
}

.app-loading p {
    margin-top: 16px;
    color: #6c757d;
    font-size: 14px;
}

.chat-content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
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

.loading-indicator {
    display: flex;
    align-items: center;
    padding: 16px;
    margin: 0 0 16px 56px;
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid rgba(143, 148, 251, 0.3);
    border-top-color: #8f94fb;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-right: 10px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.streaming-message {
    display: flex;
    margin-bottom: 16px;
    animation: fadeIn 0.5s ease forwards;
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
    -webkit-tap-highlight-color: transparent
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