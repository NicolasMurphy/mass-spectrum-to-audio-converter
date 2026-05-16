def mz_to_frequency_linear(mz: float, offset: float = 300) -> float:
    return mz + offset


def mz_to_frequency_inverse(
    mz: float, scale: float = 100000, shift: float = 1
) -> float:
    if mz + shift == 0:
        raise ValueError(
            f"Inverse algorithm: peak at m/z={mz} with shift={shift} "
            f"produces division by zero. Try a different shift value."
        )
    return scale / (mz + shift)


def mz_to_frequency_modulo(
    mz: float, factor: float = 10, modulus: float = 500, base: float = 100
) -> float:
    if modulus == 0:
        raise ValueError("Modulus cannot be zero.")
    return ((mz * factor) % modulus) + base
