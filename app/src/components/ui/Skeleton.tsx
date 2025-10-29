import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width = '100%',
  height = '1rem',
  animation = 'pulse'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'wave':
        return 'animate-shimmer';
      case 'pulse':
        return 'animate-pulse';
      case 'none':
      default:
        return '';
    }
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`
        bg-slate-700 ${getVariantClasses()} ${getAnimationClasses()} ${className}
      `}
      style={style}
    />
  );
};

interface DashboardSkeletonProps {
  className?: string;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton height="2rem" width="60%" />
        <Skeleton height="1rem" width="40%" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton height="0.875rem" width="60%" />
                <Skeleton height="2rem" width="40%" />
              </div>
              <Skeleton variant="circular" width="48px" height="48px" />
            </div>
            <Skeleton height="4px" width="100%" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton height="1.5rem" width="30%" />
          <Skeleton height="1rem" width="50%" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton height="1rem" width="25%" />
              <div className="glass-card p-4">
                <Skeleton height="1.25rem" width="100%" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Questions Grid Skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton height="1.5rem" width="40%" />
          <Skeleton height="2.5rem" width="20%" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="glass-card overflow-hidden">
              {/* Image placeholder */}
              <Skeleton height="10rem" width="100%" variant="rectangular" />
              
              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton height="0.875rem" width="50%" />
                    <Skeleton height="1.25rem" width="80%" />
                  </div>
                  <Skeleton height="1.5rem" width="4rem" variant="rounded" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton height="0.875rem" width="100%" />
                  <Skeleton height="0.875rem" width="90%" />
                  <Skeleton height="0.875rem" width="70%" />
                </div>
                
                <div className="flex gap-2">
                  <Skeleton height="1.5rem" width="3rem" variant="rounded" />
                  <Skeleton height="1.5rem" width="4rem" variant="rounded" />
                </div>
                
                <div className="flex justify-between">
                  <Skeleton height="1rem" width="30%" />
                  <Skeleton height="1rem" width="25%" />
                </div>
                
                <Skeleton height="2.5rem" width="100%" variant="rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" width="20px" height="20px" />
              <Skeleton height="1.25rem" width="40%" />
            </div>
            <Skeleton height="16rem" width="100%" variant="rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

interface CardSkeletonProps {
  showImage?: boolean;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  showImage = false, 
  className = '' 
}) => {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {showImage && (
        <Skeleton height="10rem" width="100%" variant="rectangular" />
      )}
      
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton height="0.875rem" width="50%" />
            <Skeleton height="1.25rem" width="80%" />
          </div>
          <Skeleton height="1.5rem" width="4rem" variant="rounded" />
        </div>
        
        <div className="space-y-2">
          <Skeleton height="0.875rem" width="100%" />
          <Skeleton height="0.875rem" width="90%" />
          <Skeleton height="0.875rem" width="70%" />
        </div>
        
        <div className="flex gap-2">
          <Skeleton height="1.5rem" width="3rem" variant="rounded" />
          <Skeleton height="1.5rem" width="4rem" variant="rounded" />
        </div>
        
        <Skeleton height="2.5rem" width="100%" variant="rounded" />
      </div>
    </div>
  );
};

export default Skeleton;