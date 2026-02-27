FROM postgres:16-alpine

# Set timezone to Asia/Ho_Chi_Minh
ENV TZ Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Optional: place init scripts in apps/db/init/ (executed on first database creation)
# COPY ./apps/db/init /docker-entrypoint-initdb.d
