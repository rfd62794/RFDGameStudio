using System;

namespace rpgCore.Godot {
    /// <summary>
    /// Result type for operations that can fail.
    /// Enables functional error handling without exceptions.
    /// Based on Rust's Result<T> pattern.
    ///
    /// Usage:
    ///   var result = someOperation();
    ///   if (result.IsSuccess) {
    ///       var value = result.Value;
    ///   } else {
    ///       GD.PrintErr($"Error: {result.Error}");
    ///   }
    /// </summary>
    public class Result<T> {
        public bool IsSuccess { get; private set; }
        public T Value { get; private set; }
        public string Error { get; private set; }

        private Result(bool isSuccess, T value, string error) {
            IsSuccess = isSuccess;
            Value = value;
            Error = error;
        }

        public static Result<T> Success(T value) {
            return new Result<T>(true, value, null);
        }

        public static Result<T> Failure(string error) {
            return new Result<T>(false, default(T), error);
        }

        public Result<U> Map<U>(Func<T, U> mapper) {
            if (IsSuccess) {
                try {
                    return Result<U>.Success(mapper(Value));
                } catch (Exception ex) {
                    return Result<U>.Failure(ex.Message);
                }
            }
            return Result<U>.Failure(Error);
        }

        public Result<T> OnFailure(Action<string> handler) {
            if (!IsSuccess) {
                handler(Error);
            }
            return this;
        }

        public Result<T> OnSuccess(Action<T> handler) {
            if (IsSuccess) {
                handler(Value);
            }
            return this;
        }
    }

    /// <summary>
    /// Non-generic Result for operations that don't return a value.
    /// </summary>
    public class Result {
        public bool IsSuccess { get; private set; }
        public string Error { get; private set; }

        private Result(bool isSuccess, string error) {
            IsSuccess = isSuccess;
            Error = error;
        }

        public static Result Success() {
            return new Result(true, null);
        }

        public static Result Failure(string error) {
            return new Result(false, error);
        }

        public Result OnFailure(Action<string> handler) {
            if (!IsSuccess) {
                handler(Error);
            }
            return this;
        }

        public Result OnSuccess(Action handler) {
            if (IsSuccess) {
                handler();
            }
            return this;
        }
    }
}
