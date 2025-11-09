"""
Test Runner Script for Integration Tests

This script provides an easy way to run integration tests with various options.
"""
import sys
import subprocess
from pathlib import Path


def run_tests(test_file=None, verbose=False, coverage=False, markers=None):
    """
    Run integration tests with specified options
    
    Args:
        test_file: Specific test file to run (None for all)
        verbose: Enable verbose output
        coverage: Enable coverage reporting
        markers: Pytest markers to filter tests
    """
    
    # Base command
    cmd = ["pytest"]
    
    # Add test file or directory
    if test_file:
        cmd.append(test_file)
    else:
        cmd.append(".")
    
    # Add verbose flag
    if verbose:
        cmd.append("-v")
    
    # Add coverage
    if coverage:
        cmd.extend([
            "--cov=app.services.mesa_partes",
            "--cov=app.routers.mesa_partes",
            "--cov-report=html",
            "--cov-report=term"
        ])
    
    # Add markers
    if markers:
        cmd.extend(["-m", markers])
    
    # Run tests
    print(f"Running command: {' '.join(cmd)}")
    print("-" * 80)
    
    result = subprocess.run(cmd, cwd=Path(__file__).parent)
    return result.returncode


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Run Mesa de Partes integration tests")
    parser.add_argument(
        "test",
        nargs="?",
        help="Specific test file or test to run (e.g., test_flujo_completo.py)"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    parser.add_argument(
        "-c", "--coverage",
        action="store_true",
        help="Enable coverage reporting"
    )
    parser.add_argument(
        "-m", "--markers",
        help="Run tests matching given mark expression (e.g., 'not slow')"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all available tests"
    )
    
    args = parser.parse_args()
    
    if args.list:
        print("Available test files:")
        print("  - test_flujo_completo.py: Complete document workflow tests")
        print("  - test_integracion_externa.py: External integration tests")
        print("  - test_sistema_notificaciones.py: Notification system tests")
        print("  - test_generacion_reportes.py: Report generation tests")
        print("\nRun with: python run_tests.py <test_file>")
        return 0
    
    return run_tests(
        test_file=args.test,
        verbose=args.verbose,
        coverage=args.coverage,
        markers=args.markers
    )


if __name__ == "__main__":
    sys.exit(main())
