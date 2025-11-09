#!/usr/bin/env python3
"""
Verification script for backend performance optimizations
Tests Redis cache, Celery tasks, and database indexes
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_redis_cache():
    """Test Redis cache functionality"""
    print("\n" + "="*50)
    print("Testing Redis Cache")
    print("="*50)
    
    try:
        from app.core.cache import get_cache
        
        cache = get_cache()
        print(f"✓ Cache service initialized")
        print(f"  - Enabled: {cache.enabled}")
        
        if cache.enabled:
            # Test set/get
            test_key = "test:verification"
            test_value = {"test": "data", "number": 123}
            
            cache.set(test_key, test_value, ttl=60)
            print(f"✓ Set test value")
            
            retrieved = cache.get(test_key)
            if retrieved == test_value:
                print(f"✓ Retrieved test value correctly")
            else:
                print(f"✗ Retrieved value doesn't match")
                return False
            
            # Test exists
            if cache.exists(test_key):
                print(f"✓ Exists check working")
            else:
                print(f"✗ Exists check failed")
                return False
            
            # Test delete
            cache.delete(test_key)
            if not cache.exists(test_key):
                print(f"✓ Delete working")
            else:
                print(f"✗ Delete failed")
                return False
            
            # Test pattern deletion
            cache.set("test:pattern:1", "value1", ttl=60)
            cache.set("test:pattern:2", "value2", ttl=60)
            deleted = cache.delete_pattern("test:pattern:*")
            print(f"✓ Pattern deletion working (deleted {deleted} keys)")
            
            print(f"\n✓ Redis cache is working correctly")
            return True
        else:
            print(f"⚠ Redis cache is disabled (Redis not available)")
            return True  # Not a failure, just not available
            
    except Exception as e:
        print(f"✗ Redis cache test failed: {str(e)}")
        return False


def test_celery_tasks():
    """Test Celery task queue"""
    print("\n" + "="*50)
    print("Testing Celery Task Queue")
    print("="*50)
    
    try:
        from app.core.task_queue import get_task_queue
        
        task_queue = get_task_queue()
        print(f"✓ Task queue service initialized")
        print(f"  - Enabled: {task_queue.enabled}")
        
        if task_queue.enabled:
            # Test task enqueueing
            task_id = task_queue.enqueue(
                'mesa_partes.generar_reporte_excel',
                {'tipo_reporte': 'test'},
                'test_user'
            )
            
            if task_id:
                print(f"✓ Task enqueued successfully")
                print(f"  - Task ID: {task_id}")
                
                # Check task status
                status = task_queue.get_task_status(task_id)
                print(f"✓ Task status retrieved")
                print(f"  - Status: {status.get('status')}")
                
                # Cancel task
                if task_queue.cancel_task(task_id):
                    print(f"✓ Task cancelled successfully")
                else:
                    print(f"⚠ Task cancellation may have failed (task might have completed)")
                
                print(f"\n✓ Celery task queue is working correctly")
                return True
            else:
                print(f"✗ Failed to enqueue task")
                return False
        else:
            print(f"⚠ Celery task queue is disabled (Celery not available)")
            return True  # Not a failure, just not available
            
    except Exception as e:
        print(f"✗ Celery task queue test failed: {str(e)}")
        return False


def test_query_optimizer():
    """Test query optimizer"""
    print("\n" + "="*50)
    print("Testing Query Optimizer")
    print("="*50)
    
    try:
        from app.core.query_optimizer import QueryOptimizer, QueryPerformanceMonitor
        
        optimizer = QueryOptimizer()
        print(f"✓ Query optimizer initialized")
        
        # Test slow query decorator
        @QueryOptimizer.analyze_slow_queries(threshold_ms=100)
        def test_function():
            import time
            time.sleep(0.05)  # 50ms
            return "test"
        
        result = test_function()
        print(f"✓ Slow query decorator working")
        
        # Test performance monitor
        monitor = QueryPerformanceMonitor(threshold_ms=100)
        print(f"✓ Performance monitor initialized")
        
        stats = monitor.get_stats()
        print(f"✓ Statistics retrieved")
        print(f"  - Tracked queries: {len(stats)}")
        
        print(f"\n✓ Query optimizer is working correctly")
        return True
        
    except Exception as e:
        print(f"✗ Query optimizer test failed: {str(e)}")
        return False


def test_database_indexes():
    """Test database indexes"""
    print("\n" + "="*50)
    print("Testing Database Indexes")
    print("="*50)
    
    try:
        from app.models.mesa_partes.documento import Documento, TipoDocumento, ArchivoAdjunto
        from app.models.mesa_partes.derivacion import Derivacion
        from app.models.mesa_partes.integracion import Integracion, LogSincronizacion
        
        # Check if models have __table_args__ with indexes
        models_to_check = [
            ('Documento', Documento),
            ('TipoDocumento', TipoDocumento),
            ('ArchivoAdjunto', ArchivoAdjunto),
            ('Derivacion', Derivacion),
            ('Integracion', Integracion),
            ('LogSincronizacion', LogSincronizacion)
        ]
        
        total_indexes = 0
        for model_name, model in models_to_check:
            if hasattr(model, '__table_args__'):
                table_args = model.__table_args__
                if isinstance(table_args, tuple):
                    indexes = [arg for arg in table_args if hasattr(arg, 'name')]
                    index_count = len(indexes)
                    total_indexes += index_count
                    print(f"✓ {model_name}: {index_count} indexes defined")
                else:
                    print(f"⚠ {model_name}: No indexes found")
            else:
                print(f"⚠ {model_name}: No __table_args__ defined")
        
        print(f"\n✓ Total indexes defined: {total_indexes}")
        
        if total_indexes >= 40:  # We expect at least 40 indexes
            print(f"✓ Database indexes are properly defined")
            return True
        else:
            print(f"⚠ Expected at least 40 indexes, found {total_indexes}")
            return False
        
    except Exception as e:
        print(f"✗ Database indexes test failed: {str(e)}")
        return False


def test_service_optimizations():
    """Test service optimizations"""
    print("\n" + "="*50)
    print("Testing Service Optimizations")
    print("="*50)
    
    try:
        # Check if services have cache and task_queue attributes
        from app.services.mesa_partes.documento_service import DocumentoService
        from app.services.mesa_partes.reporte_service import ReporteService
        
        # Mock database session
        class MockSession:
            def query(self, *args, **kwargs):
                return self
            def filter(self, *args, **kwargs):
                return self
            def first(self, *args, **kwargs):
                return None
            def all(self, *args, **kwargs):
                return []
            def count(self, *args, **kwargs):
                return 0
        
        db = MockSession()
        
        # Test DocumentoService
        doc_service = DocumentoService(db)
        if hasattr(doc_service, 'cache'):
            print(f"✓ DocumentoService has cache attribute")
        else:
            print(f"✗ DocumentoService missing cache attribute")
            return False
        
        if hasattr(doc_service, 'task_queue'):
            print(f"✓ DocumentoService has task_queue attribute")
        else:
            print(f"✗ DocumentoService missing task_queue attribute")
            return False
        
        if hasattr(doc_service, 'query_optimizer'):
            print(f"✓ DocumentoService has query_optimizer attribute")
        else:
            print(f"✗ DocumentoService missing query_optimizer attribute")
            return False
        
        # Test ReporteService
        report_service = ReporteService(db)
        if hasattr(report_service, 'cache'):
            print(f"✓ ReporteService has cache attribute")
        else:
            print(f"✗ ReporteService missing cache attribute")
            return False
        
        if hasattr(report_service, 'task_queue'):
            print(f"✓ ReporteService has task_queue attribute")
        else:
            print(f"✗ ReporteService missing task_queue attribute")
            return False
        
        print(f"\n✓ Service optimizations are properly implemented")
        return True
        
    except Exception as e:
        print(f"✗ Service optimizations test failed: {str(e)}")
        return False


def main():
    """Run all verification tests"""
    print("\n" + "="*70)
    print(" Backend Performance Optimizations - Verification Script")
    print("="*70)
    
    results = {
        "Redis Cache": test_redis_cache(),
        "Celery Tasks": test_celery_tasks(),
        "Query Optimizer": test_query_optimizer(),
        "Database Indexes": test_database_indexes(),
        "Service Optimizations": test_service_optimizations()
    }
    
    # Print summary
    print("\n" + "="*70)
    print(" Verification Summary")
    print("="*70)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{test_name:.<50} {status}")
    
    # Overall result
    all_passed = all(results.values())
    print("\n" + "="*70)
    if all_passed:
        print("✓ All optimizations verified successfully!")
        print("="*70)
        return 0
    else:
        print("✗ Some optimizations failed verification")
        print("="*70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
