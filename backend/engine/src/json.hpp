#pragma once
// -----------------------------------------------------------------------------
// Minimal JSON output helpers. The engine only *emits* JSON; it never parses it.
// Input arrives as whitespace-delimited text tokens read from std::cin.
// -----------------------------------------------------------------------------
#include <cstdio>
#include <string>

namespace json {

inline std::string escape(const std::string &s) {
    std::string out;
    out.reserve(s.size() + 2);
    for (unsigned char c : s) {
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n";  break;
            case '\r': out += "\\r";  break;
            case '\t': out += "\\t";  break;
            default:
                if (c < 0x20) {
                    char buf[8];
                    std::snprintf(buf, sizeof(buf), "\\u%04x", c);
                    out += buf;
                } else {
                    out += static_cast<char>(c);
                }
        }
    }
    return out;
}

inline std::string str(const std::string &s) { return "\"" + escape(s) + "\""; }

}  // namespace json
