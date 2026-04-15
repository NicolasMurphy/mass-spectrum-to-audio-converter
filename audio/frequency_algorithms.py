def mz_to_frequency_linear(mz, offset: float = 300):
    return mz + offset


def mz_to_frequency_inverse(mz, scale: float = 100000, shift: float = 1):
    if mz + shift == 0:
        raise ValueError(
            f"Inverse algorithm: peak at m/z={mz} with shift={shift} "
            f"produces division by zero. Try a different shift value."
        )
    return scale / (mz + shift)


def mz_to_frequency_modulo(
    mz, factor: float = 10, modulus: float = 500, base: float = 100
):
    if modulus == 0:
        raise ValueError("Modulus cannot be zero.")
    return ((mz * factor) % modulus) + base
