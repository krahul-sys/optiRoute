# OptiRoute DAA Engine — build (multi-stage friendly)
CXX      ?= g++
CXXFLAGS ?= -O3 -std=c++17 -Wall -Wextra -I src
TARGET   := engine

SRC := src/main.cpp

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(SRC) src/graph.hpp src/dp.hpp src/trees.hpp src/utilities.hpp src/json.hpp
	$(CXX) $(CXXFLAGS) $(SRC) -o $(TARGET)

clean:
	rm -f $(TARGET)
