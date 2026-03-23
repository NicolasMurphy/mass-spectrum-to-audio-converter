import { type StatusMessageProps } from "../types";

export default function StatusMessage({ status, isLoading }: StatusMessageProps) {
  if (!status) return null;

  return (
    <div className="text-sm text-center mb-4">
      {isLoading ? (
        <span className="loading loading-spinner text-primary"></span>
      ) : (
        <span>{status}</span>
      )}
    </div>
  );
}
