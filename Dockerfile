FROM python:3.10

# Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

# Set home to the user's home directory
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set the working directory to the user's home directory
WORKDIR $HOME/app

# Copy the requirements file and install dependencies
COPY --chown=user ./requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of the application
COPY --chown=user . $HOME/app

# Run Django setup commands
RUN python manage.py collectstatic --no-input
RUN python manage.py migrate

# Expose port dynamically (Render uses 10000, Hugging Face uses 7860)
EXPOSE 7860 10000

# Run gunicorn binding to the $PORT env var (defaults to 7860 for Hugging Face)
CMD gunicorn stadium_ops.wsgi:application --bind 0.0.0.0:${PORT:-7860}
