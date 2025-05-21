package com.vehicle.dashboard.model;

import java.time.LocalDateTime;

public class SensorReading {
    private Long id;
    private String sensorId;
    private Double value;
    private String unit;
    private LocalDateTime timestamp;
    private String vehicleId;
    private String status;

    // Constructors
    public SensorReading() {}

    public SensorReading(Long id, String sensorId, Double value, String unit, 
                         LocalDateTime timestamp, String vehicleId, String status) {
        this.id = id;
        this.sensorId = sensorId;
        this.value = value;
        this.unit = unit;
        this.timestamp = timestamp;
        this.vehicleId = vehicleId;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSensorId() { return sensorId; }
    public void setSensorId(String sensorId) { this.sensorId = sensorId; }

    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getVehicleId() { return vehicleId; }
    public void setVehicleId(String vehicleId) { this.vehicleId = vehicleId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return "SensorReading{" +
                "id=" + id +
                ", sensorId='" + sensorId + '\'' +
                ", value=" + value +
                ", unit='" + unit + '\'' +
                ", timestamp=" + timestamp +
                ", vehicleId='" + vehicleId + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}