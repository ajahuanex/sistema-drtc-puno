"""
Query optimization utilities for database performance
Provides tools for analyzing and optimizing SQLAlchemy queries
"""
import logging
from typing import Any, List
from sqlalchemy import event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Query, Session
import time

logger = logging.getLogger(__name__)


class QueryOptimizer:
    """Utility class for query optimization"""
    
    @staticmethod
    def explain_query(db: Session, query: Query) -> str:
        """
        Get EXPLAIN output for a query
        
        Args:
            db: Database session
            query: SQLAlchemy query
            
        Returns:
            EXPLAIN output as string
        """
        try:
            # Get the compiled query
            compiled = query.statement.compile(
                compile_kwargs={"literal_binds": True}
            )
            
            # Execute EXPLAIN
            explain_query = text(f"EXPLAIN ANALYZE {compiled}")
            result = db.execute(explain_query)
            
            # Format output
            explain_output = "\n".join([row[0] for row in result])
            return explain_output
        except Exception as e:
            logger.error(f"Error explaining query: {e}")
            return f"Error: {str(e)}"
    
    @staticmethod
    def analyze_slow_queries(threshold_ms: float = 100):
        """
        Decorator to log slow queries
        
        Args:
            threshold_ms: Threshold in milliseconds to consider a query slow
            
        Example:
            @QueryOptimizer.analyze_slow_queries(threshold_ms=200)
            def get_documentos(db: Session):
                return db.query(Documento).all()
        """
        def decorator(func):
            def wrapper(*args, **kwargs):
                start_time = time.time()
                result = func(*args, **kwargs)
                elapsed_ms = (time.time() - start_time) * 1000
                
                if elapsed_ms > threshold_ms:
                    logger.warning(
                        f"Slow query detected in {func.__name__}: "
                        f"{elapsed_ms:.2f}ms (threshold: {threshold_ms}ms)"
                    )
                
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def optimize_pagination(query: Query, page: int, page_size: int) -> tuple:
        """
        Optimize pagination queries
        
        Args:
            query: SQLAlchemy query
            page: Page number (0-indexed)
            page_size: Number of items per page
            
        Returns:
            Tuple of (items, total_count)
        """
        # Use window function for efficient counting
        from sqlalchemy import func, over
        
        # Get total count efficiently
        total_count = query.count()
        
        # Apply pagination
        items = query.offset(page * page_size).limit(page_size).all()
        
        return items, total_count
    
    @staticmethod
    def batch_load(db: Session, model: Any, ids: List[str], batch_size: int = 100):
        """
        Load multiple records efficiently in batches
        
        Args:
            db: Database session
            model: SQLAlchemy model
            ids: List of IDs to load
            batch_size: Batch size for loading
            
        Returns:
            List of loaded records
        """
        results = []
        
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i:i + batch_size]
            batch_results = db.query(model).filter(model.id.in_(batch_ids)).all()
            results.extend(batch_results)
        
        return results
    
    @staticmethod
    def prefetch_relationships(query: Query, *relationships) -> Query:
        """
        Prefetch relationships to avoid N+1 queries
        
        Args:
            query: SQLAlchemy query
            *relationships: Relationship names to prefetch
            
        Returns:
            Query with prefetched relationships
        """
        from sqlalchemy.orm import joinedload
        
        for relationship in relationships:
            query = query.options(joinedload(relationship))
        
        return query


# Query performance monitoring
class QueryPerformanceMonitor:
    """Monitor query performance and log slow queries"""
    
    def __init__(self, threshold_ms: float = 100):
        self.threshold_ms = threshold_ms
        self.query_stats = {}
    
    def setup_monitoring(self, engine: Engine):
        """
        Setup query monitoring on database engine
        
        Args:
            engine: SQLAlchemy engine
        """
        @event.listens_for(engine, "before_cursor_execute")
        def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            conn.info.setdefault('query_start_time', []).append(time.time())
        
        @event.listens_for(engine, "after_cursor_execute")
        def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            total_time = time.time() - conn.info['query_start_time'].pop()
            total_ms = total_time * 1000
            
            # Log slow queries
            if total_ms > self.threshold_ms:
                logger.warning(
                    f"Slow query ({total_ms:.2f}ms):\n{statement}\n"
                    f"Parameters: {parameters}"
                )
            
            # Update stats
            query_key = statement[:100]  # Use first 100 chars as key
            if query_key not in self.query_stats:
                self.query_stats[query_key] = {
                    'count': 0,
                    'total_time': 0,
                    'max_time': 0,
                    'min_time': float('inf')
                }
            
            stats = self.query_stats[query_key]
            stats['count'] += 1
            stats['total_time'] += total_ms
            stats['max_time'] = max(stats['max_time'], total_ms)
            stats['min_time'] = min(stats['min_time'], total_ms)
    
    def get_stats(self) -> dict:
        """Get query statistics"""
        return {
            query: {
                **stats,
                'avg_time': stats['total_time'] / stats['count']
            }
            for query, stats in self.query_stats.items()
        }
    
    def reset_stats(self):
        """Reset query statistics"""
        self.query_stats = {}


# Index recommendations
class IndexRecommender:
    """Recommend indexes based on query patterns"""
    
    def __init__(self):
        self.query_patterns = []
    
    def analyze_query(self, query: Query):
        """
        Analyze query and store pattern
        
        Args:
            query: SQLAlchemy query
        """
        # Extract WHERE clauses
        where_clauses = []
        if hasattr(query, 'whereclause') and query.whereclause is not None:
            where_clauses.append(str(query.whereclause))
        
        # Extract ORDER BY clauses
        order_by_clauses = []
        if hasattr(query, '_order_by') and query._order_by:
            order_by_clauses.extend([str(clause) for clause in query._order_by])
        
        self.query_patterns.append({
            'where': where_clauses,
            'order_by': order_by_clauses
        })
    
    def get_recommendations(self) -> List[str]:
        """
        Get index recommendations based on analyzed queries
        
        Returns:
            List of recommended indexes
        """
        recommendations = []
        
        # Analyze patterns
        column_usage = {}
        for pattern in self.query_patterns:
            for where_clause in pattern['where']:
                # Simple pattern matching (can be improved)
                if '=' in where_clause:
                    column = where_clause.split('=')[0].strip()
                    column_usage[column] = column_usage.get(column, 0) + 1
        
        # Recommend indexes for frequently used columns
        for column, count in column_usage.items():
            if count > 5:  # Threshold
                recommendations.append(
                    f"CREATE INDEX idx_{column.replace('.', '_')} ON {column.split('.')[0]} ({column.split('.')[1]});"
                )
        
        return recommendations


# Optimization tips
OPTIMIZATION_TIPS = """
Database Query Optimization Tips:

1. Use Indexes:
   - Add indexes on frequently queried columns
   - Use composite indexes for multi-column queries
   - Monitor index usage with EXPLAIN ANALYZE

2. Avoid N+1 Queries:
   - Use joinedload() for eager loading
   - Use subqueryload() for collections
   - Batch load related objects

3. Pagination:
   - Always use LIMIT and OFFSET
   - Consider cursor-based pagination for large datasets
   - Cache total counts when possible

4. Query Optimization:
   - Select only needed columns
   - Use EXISTS instead of COUNT when checking existence
   - Avoid SELECT * in production

5. Connection Pooling:
   - Configure appropriate pool size
   - Use connection pooling for better performance
   - Monitor connection usage

6. Caching:
   - Cache frequently accessed data
   - Use Redis for distributed caching
   - Implement cache invalidation strategy

7. Monitoring:
   - Log slow queries
   - Monitor query execution time
   - Use EXPLAIN ANALYZE regularly

8. Database Maintenance:
   - Run VACUUM regularly (PostgreSQL)
   - Update statistics with ANALYZE
   - Monitor table bloat
"""


def print_optimization_tips():
    """Print optimization tips"""
    print(OPTIMIZATION_TIPS)


# Example usage
if __name__ == "__main__":
    print_optimization_tips()
