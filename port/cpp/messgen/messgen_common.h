#pragma once

#include <messgen/reflection.h>
#include <messgen/traits.h>

#if __cplusplus >= 202002L
#include "concepts.h"
#endif

#include <cstdint>
#include <type_traits>

namespace messgen {

using size_type = uint32_t;

} // namespace messgen
