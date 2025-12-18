import { SkeletonShinyGradient } from "./skeleton-shiny-gradient";

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div>
        <SkeletonShinyGradient className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
        <SkeletonShinyGradient className="h-4 w-96 bg-gray-200 rounded-lg" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-3">
                <SkeletonShinyGradient className="h-4 w-24 bg-gray-200 rounded" />
                <SkeletonShinyGradient className="h-8 w-16 bg-gray-200 rounded" />
              </div>
              <SkeletonShinyGradient className="w-12 h-12 bg-gray-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div>
        <SkeletonShinyGradient className="h-6 w-32 bg-gray-200 rounded-lg mb-2" />
        <SkeletonShinyGradient className="h-4 w-64 bg-gray-200 rounded-lg mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <SkeletonShinyGradient className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
              <SkeletonShinyGradient className="h-5 w-32 bg-gray-200 rounded mb-2" />
              <SkeletonShinyGradient className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* AI Command Box Skeleton */}
      <div>
        <SkeletonShinyGradient className="h-6 w-48 bg-gray-200 rounded-lg mb-4" />
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          <SkeletonShinyGradient className="h-12 w-full bg-gray-200 rounded-lg" />
          <SkeletonShinyGradient className="h-10 w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div>
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <SkeletonShinyGradient className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
          <SkeletonShinyGradient className="h-4 w-64 bg-gray-200 rounded-lg" />
        </div>
        <SkeletonShinyGradient className="h-10 w-40 bg-gray-200 rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex gap-4">
            <SkeletonShinyGradient className="h-4 w-32 bg-gray-200 rounded" />
            <SkeletonShinyGradient className="h-4 w-48 bg-gray-200 rounded" />
            <SkeletonShinyGradient className="h-4 w-32 bg-gray-200 rounded" />
            <SkeletonShinyGradient className="h-4 w-24 bg-gray-200 rounded ml-auto" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex gap-4 items-center">
                <SkeletonShinyGradient className="h-4 w-32 bg-gray-200 rounded" />
                <SkeletonShinyGradient className="h-4 w-48 bg-gray-200 rounded" />
                <SkeletonShinyGradient className="h-4 w-32 bg-gray-200 rounded" />
                <div className="ml-auto flex gap-4">
                  <SkeletonShinyGradient className="h-4 w-12 bg-gray-200 rounded" />
                  <SkeletonShinyGradient className="h-4 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
