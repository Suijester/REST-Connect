FROM gcc:latest

WORKDIR /app

RUN apt-get update && apt-get install -y cmake libgtest-dev

RUN mkdir -p /usr/src/googletest && \
    cd /usr/src/googletest && \
    cp -r /usr/src/gtest/* . && \
    cmake . && \
    make && \
    cp lib/*.a /usr/lib/

COPY src/dockerspace/ .

RUN g++ -o test_program test_program.cpp -lgtest -lgtest_main -pthread

CMD ["./test_program"]
