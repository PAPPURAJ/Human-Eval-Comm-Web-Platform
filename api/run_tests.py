#!/usr/bin/env python3
"""
Simple test runner for HumanEvalComm API
"""

import subprocess
import sys
import time
import requests

def check_server_running():
    """Check if the API server is running"""
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def start_server():
    """Start the API server"""
    print("🚀 Starting API server...")
    try:
        # Start server in background
        process = subprocess.Popen([
            sys.executable, "api/app.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for server to start
        for i in range(30):
            if check_server_running():
                print("✅ Server started successfully")
                return process
            time.sleep(1)
        
        print("❌ Server failed to start")
        return None
        
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return None

def run_tests():
    """Run the test suite"""
    print("🧪 Running API tests...")
    try:
        result = subprocess.run([
            sys.executable, "api/test_api.py"
        ], capture_output=True, text=True)
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return False

def main():
    """Main function"""
    print("🧪 HumanEvalComm API Test Runner")
    print("=" * 40)
    
    # Check if server is already running
    if check_server_running():
        print("✅ Server is already running")
        server_process = None
    else:
        # Start server
        server_process = start_server()
        if not server_process:
            print("❌ Cannot start server, exiting")
            return 1
    
    try:
        # Run tests
        success = run_tests()
        
        if success:
            print("\n✅ All tests passed!")
            return 0
        else:
            print("\n❌ Some tests failed!")
            return 1
            
    finally:
        # Clean up server if we started it
        if server_process:
            print("\n🛑 Stopping server...")
            server_process.terminate()
            server_process.wait()

if __name__ == "__main__":
    sys.exit(main())