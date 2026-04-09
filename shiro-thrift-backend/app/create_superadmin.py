"""
Run ONCE to create your first superadmin account.
Only superadmins can create/manage other admin accounts via the web UI.

    python -m app.create_superadmin
"""
from app.database import SessionLocal, engine, Base
from app.admin_user import AdminUser
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

def main():
    db = SessionLocal()
    try:
        print("=== Shiro's Thrift — Create Superadmin ===\n")
        username = input("Username : ").strip()
        email    = input("Email    : ").strip()
        password = input("Password : ").strip()

        if len(password) < 10:
            print("\n❌ Password must be at least 10 characters."); return
        if db.query(AdminUser).filter(AdminUser.username == username).first():
            print(f"\n❌ Username '{username}' already taken."); return
        if db.query(AdminUser).filter(AdminUser.email == email).first():
            print(f"\n❌ Email '{email}' already registered."); return

        superadmin = AdminUser(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            role="superadmin",
            is_active=True,
        )
        db.add(superadmin)
        db.commit()
        print(f"\n✅ Superadmin '{username}' created. You can now log in at /login")
    finally:
        db.close()

if __name__ == "__main__":
    main()