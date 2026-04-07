FROM node:18-bookworm

WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg fonts-noto-cjk ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

CMD ["bash"]
