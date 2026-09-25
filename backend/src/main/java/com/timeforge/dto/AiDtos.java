package com.timeforge.dto;

import java.util.List;

public class AiDtos {

    public static class ChatRequest {
        private String message;
        private List<ChatMessage> history;

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public List<ChatMessage> getHistory() { return history; }
        public void setHistory(List<ChatMessage> history) { this.history = history; }
    }

    public static class ChatMessage {
        private String role; // "user" or "model" / "assistant"
        private String text;

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
    }
}
