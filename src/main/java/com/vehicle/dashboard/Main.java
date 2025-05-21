package com.vehicle.dashboard;

import com.vehicle.dashboard.api.SensorController;
import com.vehicle.dashboard.model.SensorReading;
import com.vehicle.dashboard.service.SensorService;


import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class Main {
    public static void main(String[] args) {
        try {
            // Initialize services
            SensorService sensorService = new SensorService();
            
            // Start API server
            SensorController controller = new SensorController();
            controller.start();
            
            // Generate some initial data
            generateInitialData(sensorService);
            
            // Start data simulation
            startDataSimulation(sensorService);
            
            System.out.println("Vehicle Performance Dashboard backend started successfully!");
            System.out.println("API available at http://localhost:8080/api/sensors");
            
        } catch (SQLException | IOException e) {
            System.err.println("Error starting application: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static void generateInitialData(SensorService sensorService) throws SQLException {
        System.out.println("Generating initial sensor data...");
        
        List<SensorReading> initialReadings = new ArrayList<>();
        String[] vehicleIds = {"VIN-12345678", "VIN-87654321", "VIN-11223344"};
        String[] sensorTypes = {"TEMP", "PRES", "FUEL", "BATT", "SPEED", "RPM", "O2", "THROTTLE"};
        
        Random random = new Random();
        LocalDateTime now = LocalDateTime.now();
        
        // Generate 100 random readings over the past hour
        for (int i = 0; i < 100; i++) {
            String vehicleId = vehicleIds[random.nextInt(vehicleIds.length)];
            String sensorType = sensorTypes[random.nextInt(sensorTypes.length)];
            String sensorId = sensorType + "-" + (random.nextInt(999) + 1);
            
            double value;
            String unit;
            
            switch (sensorType) {
                case "TEMP":
                    value = 60 + random.nextDouble() * 40; // 60-100°C
                    unit = "°C";
                    break;
                case "PRES":
                    value = 20 + random.nextDouble() * 80; // 20-100 PSI
                    unit = "PSI";
                    break;
                case "FUEL":
                    value = random.nextDouble() * 100; // 0-100%
                    unit = "%";
                    break;
                case "BATT":
                    value = 11 + random.nextDouble() * 3; // 11-14V
                    unit = "V";
                    break;
                case "SPEED":
                    value = random.nextDouble() * 120; // 0-120 km/h
                    unit = "km/h";
                    break;
                case "RPM":
                    value = random.nextDouble() * 8000; // 0-8000 RPM
                    unit = "RPM";
                    break;
                case "O2":
                    value = random.nextDouble() * 100; // 0-100%
                    unit = "%";
                    break;
                case "THROTTLE":
                    value = random.nextDouble() * 100; // 0-100%
                    unit = "%";
                    break;
                default:
                    value = random.nextDouble() * 100;
                    unit = "units";
            }
            
            // Create timestamp within the past hour
            LocalDateTime timestamp = now.minusMinutes(random.nextInt(60));
            
            SensorReading reading = new SensorReading();
            reading.setSensorId(sensorId);
            reading.setValue(value);
            reading.setUnit(unit);
            reading.setTimestamp(timestamp);
            reading.setVehicleId(vehicleId);
            
            initialReadings.add(reading);
        }
        
        // Save all readings
        sensorService.saveAllSensorReadings(initialReadings);
        System.out.println("Initial data generation complete: " + initialReadings.size() + " readings created.");
    }
    
    private static void startDataSimulation(SensorService sensorService) {
        System.out.println("Starting data simulation...");
        
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
        
        // Generate new sensor readings every 5 seconds
        executor.scheduleAtFixedRate(() -> {
            try {
                generateNewSensorReading(sensorService);
            } catch (SQLException e) {
                System.err.println("Error generating sensor data: " + e.getMessage());
            }
        }, 5, 5, TimeUnit.SECONDS);
    }
    
    private static void generateNewSensorReading(SensorService sensorService) throws SQLException {
        String[] vehicleIds = {"VIN-12345678", "VIN-87654321", "VIN-11223344"};
        String[] sensorTypes = {"TEMP", "PRES", "FUEL", "BATT", "SPEED", "RPM", "O2", "THROTTLE"};
        
        Random random = new Random();
        
        // Select random vehicle and sensor
        String vehicleId = vehicleIds[random.nextInt(vehicleIds.length)];
        String sensorType = sensorTypes[random.nextInt(sensorTypes.length)];
        String sensorId = sensorType + "-" + (random.nextInt(999) + 1);
        
        double value;
        String unit;
        
        switch (sensorType) {
            case "TEMP":
                value = 60 + random.nextDouble() * 40; // 60-100°C
                unit = "°C";
                break;
            case "PRES":
                value = 20 + random.nextDouble() * 80; // 20-100 PSI
                unit = "PSI";
                break;
            case "FUEL":
                value = random.nextDouble() * 100; // 0-100%
                unit = "%";
                break;
            case "BATT":
                value = 11 + random.nextDouble() * 3; // 11-14V
                unit = "V";
                break;
            case "SPEED":
                value = random.nextDouble() * 120; // 0-120 km/h
                unit = "km/h";
                break;
            case "RPM":
                value = random.nextDouble() * 8000; // 0-8000 RPM
                unit = "RPM";
                break;
            case "O2":
                value = random.nextDouble() * 100; // 0-100%
                unit = "%";
                break;
            case "THROTTLE":
                value = random.nextDouble() * 100; // 0-100%
                unit = "%";
                break;
            default:
                value = random.nextDouble() * 100;
                unit = "units";
        }
        
        // Create new reading
        SensorReading reading = new SensorReading();
        reading.setSensorId(sensorId);
        reading.setValue(value);
        reading.setUnit(unit);
        reading.setTimestamp(LocalDateTime.now());
        reading.setVehicleId(vehicleId);
        
        // Save reading
        sensorService.saveSensorReading(reading);
    }
}