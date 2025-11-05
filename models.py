from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Enum, create_engine, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker
import enum
import os

class Base(DeclarativeBase):
    pass

class AlgoEnum(enum.Enum):
    SHA1 = "SHA1"
    SHA256 = "SHA256"
    SHA512 = "SHA512"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    pw_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Token(Base):
    __tablename__ = "tokens"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    owner: Mapped[User] = relationship(User)

    issuer: Mapped[str | None] = mapped_column(String(120), nullable=True)
    account_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    label: Mapped[str] = mapped_column(String(240))

    # Encrypted secret (Fernet base64)
    secret_enc: Mapped[str] = mapped_column(String(512))

    period: Mapped[int] = mapped_column(Integer, default=30)
    digits: Mapped[int] = mapped_column(Integer, default=6)
    algorithm: Mapped[AlgoEnum] = mapped_column(Enum(AlgoEnum), default=AlgoEnum.SHA1)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

def get_engine():
    url = os.getenv("DATABASE_URL", "sqlite:///otp.db")
    engine = create_engine(url, echo=False)
    return engine

def get_sessionmaker():
    engine = get_engine()
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)

