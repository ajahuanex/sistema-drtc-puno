"""
Verification script to check integration tests structure and completeness
"""
import os
from pathlib import Path
import ast


def check_file_exists(filepath):
    """Check if a file exists"""
    return Path(filepath).exists()


def count_test_methods(filepath):
    """Count test methods in a Python file"""
    if not check_file_exists(filepath):
        return 0
    
    with open(filepath, 'r', encoding='utf-8') as f:
        tree = ast.parse(f.read())
    
    count = 0
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name.startswith('test_'):
            count += 1
    
    return count


def verify_integration_tests():
    """Verify all integration test files"""
    
    print("=" * 80)
    print("INTEGRATION TESTS VERIFICATION")
    print("=" * 80)
    print()
    
    # Define expected files
    test_files = {
        "test_flujo_completo.py": "Complete document workflow tests",
        "test_integracion_externa.py": "External integration tests",
        "test_sistema_notificaciones.py": "Notification system tests",
        "test_generacion_reportes.py": "Report generation tests"
    }
    
    support_files = {
        "conftest.py": "Test fixtures and configuration",
        "pytest.ini": "Pytest configuration",
        "README.md": "Documentation",
        "run_tests.py": "Test runner script",
        "__init__.py": "Package initialization",
        "TASK_23_COMPLETION_SUMMARY.md": "Completion summary"
    }
    
    # Check test files
    print("📋 TEST FILES:")
    print("-" * 80)
    total_tests = 0
    
    for filename, description in test_files.items():
        exists = check_file_exists(filename)
        test_count = count_test_methods(filename) if exists else 0
        total_tests += test_count
        
        status = "✅" if exists else "❌"
        print(f"{status} {filename:40} {description}")
        if exists:
            print(f"   └─ Test methods: {test_count}")
    
    print()
    print(f"Total test methods: {total_tests}")
    print()
    
    # Check support files
    print("📁 SUPPORT FILES:")
    print("-" * 80)
    
    for filename, description in support_files.items():
        exists = check_file_exists(filename)
        status = "✅" if exists else "❌"
        print(f"{status} {filename:40} {description}")
    
    print()
    
    # Summary
    all_test_files = all(check_file_exists(f) for f in test_files.keys())
    all_support_files = all(check_file_exists(f) for f in support_files.keys())
    
    print("=" * 80)
    print("SUMMARY:")
    print("-" * 80)
    print(f"Test files: {'✅ All present' if all_test_files else '❌ Some missing'}")
    print(f"Support files: {'✅ All present' if all_support_files else '❌ Some missing'}")
    print(f"Total test methods: {total_tests}")
    print()
    
    if all_test_files and all_support_files and total_tests > 0:
        print("✅ VERIFICATION PASSED - All integration tests are properly set up!")
        print()
        print("Next steps:")
        print("1. Install dependencies: pip install pytest pytest-asyncio httpx sqlalchemy aiosqlite openpyxl")
        print("2. Run tests: pytest -v")
        print("3. Run with coverage: pytest --cov=app.services.mesa_partes --cov-report=html")
        return True
    else:
        print("❌ VERIFICATION FAILED - Some files are missing or no tests found")
        return False


if __name__ == "__main__":
    import sys
    success = verify_integration_tests()
    sys.exit(0 if success else 1)
