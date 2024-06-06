import { sqlConnect, getSqlPool } from "../src/utils/db";
import sql from "mssql";

// Mock the sql module
jest.mock("mssql");

describe("getSqlPool", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  it("should throw an error if pool is not created", () => {
    // Call getSqlPool before creating the pool
    expect(getSqlPool).toThrow(
      new Error("Pool was not created. Ensure the database is connected.")
    );
  });

  it("should return the pool if it is created", async () => {
    // Mock pool object
    const mockPool = {} as sql.ConnectionPool;
    (sql.connect as jest.Mock).mockResolvedValue(mockPool);

    // Call sqlConnect to create the pool
    await sqlConnect();

    // Verify that getSqlPool returns the created pool
    expect(getSqlPool()).toBe(mockPool);
  });
});
