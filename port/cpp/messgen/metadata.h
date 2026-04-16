#pragma once

#include "span.h"

#include <string_view>

namespace messgen {

struct metadata {
    uint64_t hash{};
    std::string_view name;
    std::string_view schema;
    span<const metadata *> dependencies{};
};

}
