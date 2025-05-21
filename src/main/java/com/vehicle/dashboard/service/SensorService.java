package com.vehicle.dashboard.service;

import com.vehicle.dashboard.model.SensorReading;
import com.vehicle.dashboard.repository.SensorRepository;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public class SensorService {
    private final SensorRepository repository;

    public SensorService() throws SQLException {
        this.repository = new SensorRepository();
    }

    public List<SensorReading> getAllReadings() throws SQLException {
        return repository.findAll();
    }

    public List<SensorReading> getReadingsByVehicleId(String vehicleId) throws SQLException {
        return repository.findByVehicleId(vehicleId);
    }

    public List<SensorReading> getReadingsBySensorId(String sensorId) throws SQLException {
        return repository.findBySensorId(sensorId);
    }

    public List<SensorReading> getLatestReadings(int limit) throws SQLException {
        return repository.findLatestReadings(limit);
    }

    public Optional<SensorReading> getReadingById(Long id) throws SQLException {
        return repository.findById(id);
    }

    public void saveSensorReading(SensorReading reading) throws SQLException {
        // Set timestamp if not provided
        if (reading.getTimestamp() == null) {
            reading.setTimestamp(LocalDateTime.now());
        }
        
        // Determine status if not provided
        if (reading.getStatus() == null) {
            reading.setStatus(determineStatus(reading));
        }
        
        repository.save(reading);
    }

    public void saveAllSensorReadings(List<SensorReading> readings) throws SQLException {
        // Process readings using Java 8 streams
        List<SensorReading> processedReadings = readings.stream()
            .map(reading -> {
                // Set timestamp if not provided
                if (reading.getTimestamp() == null) {
                    reading.setTimestamp(LocalDateTime.now());
                }
                
                // Determine status if not provided
                if (reading.getStatus() == null) {
                    reading.setStatus(determineStatus(reading));
                }
                
                return reading;
            })
            .collect(Collectors.toList());
        
        repository.saveAll(processedReadings);
    }

    public Map<String, Double> getAverageReadingsByVehicle() throws SQLException {
        List<SensorReading> allReadings = repository.findAll();
        
        return allReadings.stream()
            .collect(Collectors.groupingBy(
                SensorReading::getVehicleId,
                Collectors.averagingDouble(SensorReading::getValue)
            ));
    }

    public Map<String, List<SensorReading>> getReadingsGroupedBySensor() throws SQLException {
        List<SensorReading> allReadings = repository.findAll();
        
        return allReadings.stream()
            .collect(Collectors.groupingBy(SensorReading::getSensorId));
    }

    public List<SensorReading> getAnomalies() throws SQLException {
        List<SensorReading> allReadings = repository.findAll();
        
        return allReadings.stream()
            .filter(reading -> "critical".equals(reading.getStatus()))
            .sorted(Comparator.comparing(SensorReading::getTimestamp).reversed())
            .collect(Collectors.toList());
    }

    private String determineStatus(SensorReading reading) {
        // This is a simplified example - in a real application, you would have
        // more sophisticated logic based on sensor type, vehicle type, etc.
        String sensorId = reading.getSensorId();
        double value = reading.getValue();
        
        if (sensorId.startsWith("TEMP")) {
            if (value > 95) return "critical";
            if (value > 85) return "warning";
            return "normal";
        } else if (sensorId.startsWith("PRES")) {
            if (value < 25) return "critical";
            if (value < 35) return "warning";
            return "normal";
        } else if (sensorId.startsWith("FUEL")) {
            if (value < 10) return "critical";
            if (value < 20) return "warning";
            return "normal";
        } else if (sensorId.startsWith("BATT")) {
            if (value < 11.5) return "critical";
            if (value < 12.0) return "warning";
            return "normal";
        }
        
        // Default case
        return "normal";
    }
}
