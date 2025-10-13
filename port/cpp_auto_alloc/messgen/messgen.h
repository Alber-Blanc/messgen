#pragma once

#include <messgen/messgen_common.h>

namespace messgen {

template <class T>
using reflect_t = T *; // we could use a hard type instead, but that would incur
// a penalty on compile time

}
