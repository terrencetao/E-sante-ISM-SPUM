from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    pin: str = Field(min_length=4, max_length=4)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePinRequest(BaseModel):
    old_pin: str = Field(min_length=4, max_length=4)
    new_pin: str = Field(min_length=4, max_length=4)
