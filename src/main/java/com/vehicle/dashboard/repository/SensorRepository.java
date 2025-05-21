package com.vehicle.dashboard.repository;

import com.vehicle.dashboard.model.SensorReading;
import com.vehicle.dashboard.util.DatabaseConnection;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class SensorRepository {
    private final Connection connection;

    public SensorRepository() throws SQLException {
        this.connection = DatabaseConnection.getConnection();
    }

    public List<SensorReading> findAll() throws SQLException {
        List<SensorReading> readings = new ArrayList<>();
        String sql = "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT ";

        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                readings.add(mapResultSetToSensorReading(rs));
            }
        }

        return readings;
    }

    public List<SensorReading> findByVehicleId(String vehicleId) throws SQLException {
        String sql = "SELECT * FROM sensor_readings WHERE vehicle_id = ? ORDER BY timestamp DESC ";
        List<SensorReading> readings = new ArrayList<>();

        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, vehicleId);
            
            //    ResultSet rs = pstmt.executeQuery();
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    readings.add(mapResultSetToSensorReading(rs));
                }
            }
        }

        return readings;
    }

    public List<SensorReading> findBySensorId(String sensorId) throws SQLException {
        String sql = "SELECT * FROM sensor_readings WHERE sensor_id = ? ORDER BY timestamp DESC";
        List<SensorReading> readings = new ArrayList<>();

        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, sensorId);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    readings.add(mapResultSetToSensorReading(rs));
                }
            }
        }

        return readings;
    }

    public List<SensorReading> findLatestReadings(int limit) throws SQLException {
        String sql = "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT ?";
        List<SensorReading> readings = new ArrayList<>();

        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setInt(1,limit);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    readings.add(mapResultSetToSensorReading(rs));
                }
            }
        }

        return readings;
    }

    public Optional<SensorReading> findById(Long id) throws SQLException {
        String sql = "SELECT * FROM sensor_readings WHERE id = ?";

        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setLong(1, id);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToSensorReading(rs));
                }
            }
        }

        return Optional.empty();
    }

    public void save(SensorReading reading) throws SQLException {
        String sql = "INSERT INTO sensor_readings (sensor_id, value, unit, timestamp, vehicle_id, status) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";

        try (PreparedStatement pstmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            pstmt.setString(1, reading.getSensorId());
            pstmt.setDouble(2, reading.getValue());
            pstmt.setString(3, reading.getUnit());
            pstmt.setTimestamp(4, Timestamp.valueOf(reading.getTimestamp()));
            pstmt.setString(5, reading.getVehicleId());
            pstmt.setString(6, reading.getStatus());
            
            int affectedRows = pstmt.executeUpdate();
            
            if (affectedRows > 0) {
                try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        reading.setId(generatedKeys.getLong(1));
                    }
                }
            }
        }
    }

    public void saveAll(List<SensorReading> readings) throws SQLException {
        String sql = "INSERT INTO sensor_readings (sensor_id, value, unit, timestamp, vehicle_id, status) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";

        try (PreparedStatement pstmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            for (SensorReading reading : readings) {
                pstmt.setString(1, reading.getSensorId());
                pstmt.setDouble(2, reading.getValue());
                pstmt.setString(3, reading.getUnit());
                pstmt.setTimestamp(4, Timestamp.valueOf(reading.getTimestamp()));
                pstmt.setString(5, reading.getVehicleId());
                pstmt.setString(6, reading.getStatus());
                pstmt.addBatch();
            }
            
            pstmt.executeBatch();
        }
    }

    private SensorReading mapResultSetToSensorReading(ResultSet rs) throws SQLException {
        return new SensorReading(
            rs.getLong("id"),
            rs.getString("sensor_id"),
            rs.getDouble("value"),
            rs.getString("unit"),
            rs.getTimestamp("timestamp").toLocalDateTime(),
            rs.getString("vehicle_id"),
            rs.getString("status")
        );
    }
}
