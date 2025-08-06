import os
import uuid 
from flask import Flask, request, jsonify, render_template, make_response
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

#Set a secret key for signing cookies.
app.secret_key = os.getenv("FLASK_SECRET_KEY", "a-default-secret-key-for-development")

try:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not found in environment variables.")
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
except Exception as e:
    print(f"Error configuring GenerativeAI: {e}")


# This dictionary will act as our in-memory session storage.
# Key: session_id (string)
# Value: genai.ChatSession object
chat_sessions = {}


@app.route("/")
def index():
    return render_template("index.html")
    


@app.route("/welcome", methods=["GET"])
def welcome():
    try:
        welcome_message = "You are Legal Advisory assistant. Greet the user and encourage them to provide their details at left side of the page and ask a question."

        responseData = model.generate_content(welcome_message)
        message = responseData.text

        return jsonify({'response': message})
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "An internal server error occurred. Please try again later."}), 500



@app.route("/chat", methods=["POST"])
def chat():
    try:
        session_id = request.cookies.get("session_id")
        data = request.json
        print("Recived request: ", data)
        message = data.get("message")

        if not message:
            return jsonify({"error": "Message content is required."}), 400


        if not session_id or session_id not in chat_sessions:
            print("Creating a new session.")
            name = data.get("name")
            gender_input = data.get("gender")
            age = data.get("age")

            
            if not all([name, gender_input, age]):
                return jsonify({"error": "Name, gender, and age are required to start a new chat."}), 400

    
            session_id = str(uuid.uuid4())
            gender = gender_input.lower()
            pronoun = "he" if gender == "male" else "she"

            # print

            prompt = (
                f"You are a helpful legal rights assistant. You are talking to {name}, a {age}-year-old {gender}. "
                f"Your primary goal is to provide simple, clear, and actionable advice using relatable examples. "
                f"Keep your answers concise and easy to understand. Address {name} directly using their name and the pronoun '{pronoun}'. "
                f"The user is starting the conversation with this issue: '{message}'"
            )

            chat_session = model.start_chat(history=[
                {'role': 'user', 'parts': [prompt]},
                {'role': 'model', 'parts': [f"Hello {name}! I understand you have a question. Let's break it down. What can I help you with?"]}
            ])

            chat_sessions[session_id] = chat_session

        current_chat = chat_sessions.get(session_id)

        if not current_chat:
            return jsonify({"error": "Your session has expired. Please refresh the page to start over."}), 400

        print(f"Continuing session {session_id}.")
        response = current_chat.send_message(message)

        json_response = jsonify({
            "response": response.text,
        })

        resp_object = make_response(json_response)

        resp_object.set_cookie("session_id", session_id, max_age=60*60*24*1)

        return resp_object

    except Exception as e:
        print(f"An error occurred in /chat: {e}")
        return jsonify({"error": "An internal server error occurred. Please try again later."}), 500


if __name__ == "__main__":
    app.run(debug=True)