# In users/utils.py (A NEW FILE)

import random

def generate_otp():
    """
    Generates a random 6-digit number as a string.
    """
    otp = ""
    for i in range(6):
        otp += str(random.randint(0, 9))
    return otp