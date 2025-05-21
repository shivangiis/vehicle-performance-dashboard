package com.vehicle.dashboard.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseConnection {
    private static final String URL = "jdbc:postgresql://localhost:5432/vehicle_dashboard"; // PostgreSQL ka default port 5432 hota hai
    private static final String USER = "postgres";  // PostgreSQL username
    private static final String PASSWORD = "root";  // PostgreSQL password
    private static final String JDBC_DRIVER = "org.postgresql.Driver"; // PostgreSQL JDBC driver

    private static Connection connection;

    public static Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            try {
                // Load the JDBC driver (optional in modern JDBC)
                Class.forName(JDBC_DRIVER);
                connection = DriverManager.getConnection(URL, USER, PASSWORD);
                //initializeDatabase();
            } catch (ClassNotFoundException e) {
                throw new SQLException("PostgreSQL JDBC driver not found", e);
            }
        }
        return connection;
    }

    private static void initializeDatabase() throws SQLException {
        try (Statement stmt = connection.createStatement()) {
            // PostgreSQL mein AUTO_INCREMENT ki jagah SERIAL use hota hai
            String createTableSQL =
                    "CREATE TABLE IF NOT EXISTS sensor_readings (" +
                            "id SERIAL PRIMARY KEY, " +
                            "sensor_id VARCHAR(50) NOT NULL, " +
                            "value DOUBLE PRECISION NOT NULL, " +
                            "unit VARCHAR(20) NOT NULL, " +
                            "timestamp TIMESTAMP NOT NULL, " +
                            "vehicle_id VARCHAR(50) NOT NULL, " +
                            "status VARCHAR(20) NOT NULL" +
                            ")";

            stmt.execute(createTableSQL);

            // Indexes create karna same rehta hai PostgreSQL mein
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_sensor_readings_vehicle_id ON sensor_readings(vehicle_id)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON sensor_readings(sensor_id)");
        }
    }
}
