import React from 'react';

export default function QuestionSkeleton() {
  return (
    <div className="glass-card p-6 max-w-3xl mx-auto">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-4" />
        <div className="h-48 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-gray-700 rounded" />
          <div className="h-12 bg-gray-700 rounded" />
          <div className="h-12 bg-gray-700 rounded" />
          <div className="h-12 bg-gray-700 rounded" />
        </div>
        <div className="mt-6 flex gap-3">
          <div className="h-10 bg-gray-700 rounded flex-1" />
          <div className="h-10 bg-gray-700 rounded w-36" />
        </div>
      </div>
    </div>
  );
}
