#!/usr/bin/env python3
"""
WebSocket client for Double Nickel Take Home Challenge backend.
Connects to the chat server and allows interactive conversation.
"""

import json
import asyncio
import websockets
import sys
from typing import Optional, Dict, Any


class ChatWebSocketClient:
    """WebSocket client for chatting with the job application screening bot."""
    
    def __init__(self, uri: str = "ws://localhost:3000"):
        self.uri = uri
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.conversation_id: Optional[str] = None
        self.current_message_buffer: str = ""
        self.running = True
    
    async def connect(self):
        """Connect to the WebSocket server."""
        try:
            self.websocket = await websockets.connect(self.uri)
            print(f"✓ Connected to {self.uri}")
        except Exception as e:
            print(f"✗ Failed to connect: {e}")
            sys.exit(1)
    
    async def disconnect(self):
        """Close the WebSocket connection."""
        if self.websocket:
            await self.websocket.close()
            print("\n✓ Disconnected from server")
    
    async def send_message(self, message: Dict[str, Any]):
        """Send a JSON message to the server."""
        if self.websocket:
            await self.websocket.send(json.dumps(message))
    
    async def start_conversation(self, user_id: str, job_id: str):
        """Start a new conversation."""
        await self.send_message({
            "type": "start_conversation",
            "userId": user_id,
            "jobId": job_id
        })
        print(f"📤 Started conversation (userId: {user_id}, jobId: {job_id})")
    
    async def send_user_message(self, message: str):
        """Send a user message in the conversation."""
        if not self.conversation_id:
            print("✗ No active conversation. Start a conversation first.")
            return
        
        await self.send_message({
            "type": "send_message",
            "conversationId": self.conversation_id,
            "message": message
        })
        print(f"📤 You: {message}")
    
    async def end_conversation(self):
        """End the current conversation."""
        if not self.conversation_id:
            print("✗ No active conversation.")
            return
        
        await self.send_message({
            "type": "end_conversation",
            "conversationId": self.conversation_id
        })
        print("📤 Ended conversation")
    
    def handle_server_message(self, message: Dict[str, Any]):
        """Handle incoming server messages."""
        msg_type = message.get("type")
        
        if msg_type == "greeting":
            # Streaming greeting chunks
            chunk = message.get("message", "")
            if message.get("conversationId"):
                self.conversation_id = message["conversationId"]
            print(chunk, end="", flush=True)
        
        elif msg_type == "message":
            # Streaming assistant message chunks
            chunk = message.get("message", "")
            print(chunk, end="", flush=True)
        
        elif msg_type == "status_update":
            status = message.get("status", "")
            if message.get("conversationId"):
                self.conversation_id = message["conversationId"]
            print(f"\n\n[Status: {status}]")
            if status == "DONE":
                self.running = False
        
        elif msg_type == "error":
            error = message.get("error", "Unknown error")
            print(f"\n✗ Error: {error}")
        
        elif msg_type == "conversation_end":
            message_text = message.get("message", "")
            status = message.get("status", "")
            print(f"\n\n[Conversation Ended]")
            if message_text:
                print(f"Message: {message_text}")
            if status:
                print(f"Status: {status}")
            self.running = False
        
        else:
            print(f"\n? Unknown message type: {msg_type}")
    
    async def listen(self):
        """Listen for messages from the server."""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                self.handle_server_message(data)
        except websockets.exceptions.ConnectionClosed:
            print("\n✗ Connection closed by server")
            self.running = False
        except Exception as e:
            print(f"\n✗ Error listening: {e}")
            self.running = False
    
    async def interactive_mode(self):
        """Run in interactive mode, reading user input and sending messages."""
        print("\n" + "="*60)
        print("Double Nickel Chat Client")
        print("="*60)
        print("\nCommands:")
        print("  /quit or /exit - Exit the client")
        print("  /end - End the conversation")
        print("  /help - Show this help message")
        print("  Any other text - Send as a message")
        print("\n" + "="*60 + "\n")
        
        # Start listening task
        listen_task = asyncio.create_task(self.listen())
        
        # Read user input
        loop = asyncio.get_event_loop()
        while self.running:
            try:
                # Use asyncio to read from stdin (non-blocking)
                user_input = await loop.run_in_executor(None, sys.stdin.readline)
                
                if not user_input:
                    break
                
                user_input = user_input.strip()
                
                if not user_input:
                    continue
                
                # Handle commands
                if user_input.lower() in ["/quit", "/exit"]:
                    print("👋 Goodbye!")
                    self.running = False
                    break
                
                elif user_input.lower() == "/end":
                    await self.end_conversation()
                    continue
                
                elif user_input.lower() == "/help":
                    print("\nCommands:")
                    print("  /quit or /exit - Exit the client")
                    print("  /end - End the conversation")
                    print("  /help - Show this help message")
                    print("  Any other text - Send as a message\n")
                    continue
                
                # Send message
                await self.send_user_message(user_input)
            
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                self.running = False
                break
            except Exception as e:
                print(f"\n✗ Error: {e}")
        
        # Cancel listen task
        listen_task.cancel()
        try:
            await listen_task
        except asyncio.CancelledError:
            pass


async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="WebSocket client for Double Nickel chat server")
    parser.add_argument("--uri", default="ws://localhost:3000", help="WebSocket server URI")
    parser.add_argument("--user-id", required=True, help="User ID for the conversation")
    parser.add_argument("--job-id", required=True, help="Job ID for the conversation")
    
    args = parser.parse_args()
    
    client = ChatWebSocketClient(uri=args.uri)
    
    try:
        await client.connect()
        
        # Start conversation
        await client.start_conversation(args.user_id, args.job_id)
        
        # Wait a bit for greeting to start
        await asyncio.sleep(0.1)
        
        # Enter interactive mode
        await client.interactive_mode()
    
    finally:
        await client.disconnect()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
