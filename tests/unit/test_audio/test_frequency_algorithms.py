from audio import (
    mz_to_frequency_inverse,
    mz_to_frequency_linear,
    mz_to_frequency_modulo,
)


# linear tests
def test_mz_to_frequency_linear_basic():
    """Test that linear frequency conversion works with basic values"""
    # Default offset is +300
    assert mz_to_frequency_linear(100) == 400  # 100 + 300
    assert mz_to_frequency_linear(200) == 500  # 200 + 300
    assert mz_to_frequency_linear(0) == 300  # 0 + 300


def test_mz_to_frequency_linear_custom_offset():
    """Test linear frequency conversion with custom offset"""
    assert mz_to_frequency_linear(100, offset=500) == 600  # 100 + 500
    assert mz_to_frequency_linear(50, offset=0) == 50  # 50 + 0


# inverse tests
def test_mz_to_frequency_inverse_basic():
    """Test that inverse frequency conversion works with basic values"""
    # Default: scale=100000, shift=1
    assert mz_to_frequency_inverse(99) == 1000  # 100000 / (99 + 1) = 1000
    assert mz_to_frequency_inverse(999) == 100  # 100000 / (999 + 1) = 100


def test_mz_to_frequency_inverse_custom_scale():
    """Test inverse frequency conversion with custom scale"""
    # Custom scale=50000, default shift=1
    assert mz_to_frequency_inverse(99, scale=50000) == 500  # 50000 / (99 + 1)
    assert mz_to_frequency_inverse(999, scale=50000) == 50  # 50000 / (999 + 1)


def test_mz_to_frequency_inverse_custom_shift():
    """Test inverse frequency conversion with custom shift"""
    # Default scale=100000, custom shift=2
    assert mz_to_frequency_inverse(98, shift=2) == 1000  # 100000 / (98 + 2)
    assert mz_to_frequency_inverse(998, shift=2) == 100  # 100000 / (998 + 2)


def test_mz_to_frequency_inverse_custom_both():
    """Test inverse frequency conversion with both custom scale and shift"""
    # Custom scale=1000, custom shift=4
    assert mz_to_frequency_inverse(1, scale=1000, shift=4) == 200  # 1000 / (1 + 4)
    assert mz_to_frequency_inverse(96, scale=1000, shift=4) == 10  # 1000 / (96 + 4)


def test_mz_to_frequency_inverse_zero_mz():
    """Test inverse frequency conversion with zero m/z value"""
    # Should handle mz=0 without issues
    assert mz_to_frequency_inverse(0) == 100000  # 100000 / (0 + 1)
    assert mz_to_frequency_inverse(0, scale=1000, shift=2) == 500  # 1000 / (0 + 2)


def test_mz_to_frequency_modulo_basic():
    """Test that modulo frequency conversion works with basic values"""
    # Default: factor=10, modulus=500, base=100
    assert mz_to_frequency_modulo(20) == 300  # ((20 * 10) % 500) + 100
    assert mz_to_frequency_modulo(75) == 350  # ((75 * 10) % 500) + 100
    assert mz_to_frequency_modulo(0) == 100  # ((0 * 10) % 500) + 100


def test_mz_to_frequency_modulo_custom_factor():
    """Test modulo frequency conversion with custom factor"""
    assert mz_to_frequency_modulo(10, factor=5) == 150  # ((10 * 5) % 500) + 100
    assert mz_to_frequency_modulo(20, factor=3) == 160  # ((20 * 3) % 500) + 100


def test_mz_to_frequency_modulo_custom_modulus():
    """Test modulo frequency conversion with custom modulus"""
    assert mz_to_frequency_modulo(60, modulus=100) == 100  # ((60 * 10) % 100) + 100
    assert mz_to_frequency_modulo(25, modulus=200) == 150  # ((25 * 10) % 200) + 100


def test_mz_to_frequency_modulo_custom_base():
    """Test modulo frequency conversion with custom base"""
    assert mz_to_frequency_modulo(20, base=50) == 250  # ((20 * 10) % 500) + 50
    assert mz_to_frequency_modulo(30, base=200) == 500  # ((30 * 10) % 500) + 200


def test_mz_to_frequency_modulo_custom_all():
    """Test modulo frequency conversion with all custom parameters"""
    assert (
        mz_to_frequency_modulo(15, factor=3, modulus=40, base=200) == 205
    )  # ((15 * 3) % 40) + 200
    assert (
        mz_to_frequency_modulo(8, factor=7, modulus=50, base=300) == 306
    )  # ((8 * 7) % 50) + 300
