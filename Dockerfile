FROM python:3.10-slim

# Working directory
WORKDIR /app

# Install system dependencies including PostgreSQL client
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    nodejs \
    npm \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Phaser via npm
RUN npm install -g http-server

# Copy the application code
COPY . .

# Expose ports for FastAPI and for serving static files
EXPOSE 8000 8080

# Command to run the FastAPI app in development mode with hot reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
