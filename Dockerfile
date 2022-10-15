FROM node:16.17.1

WORKDIR /usr/src/smartbrain-api

COPY ./ ./

RUN npm install

CMD ["/bin/bash"]