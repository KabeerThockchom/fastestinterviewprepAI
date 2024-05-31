# # Use an official Python runtime as the base image
# FROM python:3.11

# # Set the working directory in the container
# WORKDIR /app

# COPY build ./build

# COPY app.py /app/app.py

# # Copy the requirements file to the working directory
# COPY requirements.txt .

# # Install the Python dependencies
# RUN pip install --no-cache-dir -r requirements.txt

# # # Copy the application code to the working directory
# COPY . .

# # Expose the port on which the Flask app will run
# EXPOSE 8080

# ENV DOCKER_DEFAULT_PLATFORM=linux/amd64

# ENV api_key = "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"

# # Set the entry point command to run thxwx Flask app
# CMD ["python", "app.py"]

# # CMD ["gunicorn"  , "-b", "0.0.0.0:8888", "app:app"]

# Use an official Python runtime as the base image
FROM python:3.11

# Set the working directory in the container
WORKDIR /app

# Copy the built React app to the working directory
COPY build ./build

# Copy the Flask app to the working directory
COPY app.py /app/app.py

# Copy the requirements file to the working directory
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code to the working directory
COPY . .

# Expose the port on which the Flask app will run
EXPOSE 8080

# Set the environment variable for the API key
# ENV api_key="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"

# Set the entry point command to run the Flask app
CMD ["python", "app.py"]