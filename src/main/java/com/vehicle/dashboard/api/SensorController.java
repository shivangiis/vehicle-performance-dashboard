package com.vehicle.dashboard.api;

import com.vehicle.dashboard.model.SensorReading;
import com.vehicle.dashboard.service.SensorService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Scanner;
import java.util.concurrent.Executors;

public class SensorController {
    private final SensorService sensorService;
    private final HttpServer server;

    public SensorController() throws SQLException, IOException {
        this.sensorService = new SensorService();
        this.server = HttpServer.create(new InetSocketAddress(8080), 0);

        // Configure routes
        server.createContext("/api/sensors", new GetSensorsHandler());
        server.createContext("/api/sensors/latest", new GetLatestSensorsHandler());
        server.createContext("/api/sensors/vehicle", new GetSensorsByVehicleHandler());
        server.createContext("/api/sensors/add", new AddSensorHandler());

        // Set executor
        server.setExecutor(Executors.newFixedThreadPool(10));
    }

    public void start() {
        server.start();
        System.out.println("Server started on port 8080");
    }

    private class GetSensorsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);

            if (!exchange.getRequestMethod().equals("GET")) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }

            try {
                List<SensorReading> readings = sensorService.getAllReadings();
                String response = convertToJson(readings);

                exchange.sendResponseHeaders(200, response.getBytes().length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
            } catch (SQLException e) {
                String errorMessage = "{\"error\":\"" + e.getMessage() + "\"}";
                exchange.sendResponseHeaders(500, errorMessage.getBytes().length);

                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(errorMessage.getBytes());
                }
            }
        }
    }

    private class GetLatestSensorsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);

            if (!exchange.getRequestMethod().equals("GET")) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }

            try {
                int limit = 10;
                String query = exchange.getRequestURI().getQuery();
                if (query != null && query.contains("limit=")) {
                    limit = Integer.parseInt(query.split("limit=")[1].split("&")[0]);
                }

                List<SensorReading> readings = sensorService.getLatestReadings(limit);
                String response = convertToJson(readings);

                exchange.sendResponseHeaders(200, response.getBytes().length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
            } catch (SQLException e) {
                String errorMessage = "{\"error\":\"" + e.getMessage() + "\"}";
                exchange.sendResponseHeaders(500, errorMessage.getBytes().length);

                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(errorMessage.getBytes());
                }
            }
        }
    }
    
    private void addCorsHeaders(HttpExchange exchange) throws IOException {
        String origin = exchange.getRequestHeaders().getFirst("Origin");
        if (origin != null) {
            if (origin.equals("http://localhost:5500") || origin.equals("http://127.0.0.1:5500")) {
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", origin);
            } else {
                // Or allow all origins if needed: exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            }
        }

        // Allow methods you want to support, like GET, POST, etc.
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

        // Allow specific headers
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

        // If pre-flight request (OPTIONS), respond with a 200 OK
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(200, -1);
        }
    }


    private class GetSensorsByVehicleHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);

            if (!exchange.getRequestMethod().equals("GET")) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }

            try {
                String query = exchange.getRequestURI().getQuery();
                if (query == null || !query.contains("vehicleId=")) {
                    exchange.sendResponseHeaders(400, -1); // Bad Request
                    return;
                }

                String vehicleId = query.split("vehicleId=")[1].split("&")[0];
                
               
                List<SensorReading> readings = sensorService.getReadingsByVehicleId(vehicleId);
                String response = convertToJson(readings);

                exchange.sendResponseHeaders(200, response.getBytes().length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
            } catch (SQLException e) {
                String errorMessage = "{\"error\":\"" + e.getMessage() + "\"}";
                exchange.sendResponseHeaders(500, errorMessage.getBytes().length);

                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(errorMessage.getBytes());
                }
            }
        }
    }

    private class AddSensorHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);

            if (!exchange.getRequestMethod().equals("POST")) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }

            try {
                // Parse request body
                String requestBody = readRequestBody(exchange.getRequestBody());
                SensorReading reading = parseJsonToSensorReading(requestBody);

                // Save sensor reading
                sensorService.saveSensorReading(reading);

                // Return success response
                String response = "{\"success\":true,\"id\":" + reading.getId() + "}";
                exchange.sendResponseHeaders(201, response.getBytes().length);

                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
            } catch (Exception e) {
                String errorMessage = "{\"error\":\"" + e.getMessage() + "\"}";
                exchange.sendResponseHeaders(500, errorMessage.getBytes().length);

                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(errorMessage.getBytes());
                }
            }
        }
    }

    private String readRequestBody(InputStream is) {
        try (Scanner scanner = new Scanner(is).useDelimiter("\\A")) {
            return scanner.hasNext() ? scanner.next() : "";
        }
    }

    private SensorReading parseJsonToSensorReading(String json) {
        SensorReading reading = new SensorReading();

        if (json.contains("\"sensorId\":")) {
            reading.setSensorId(extractJsonValue(json, "sensorId"));
        }

        if (json.contains("\"value\":")) {
            reading.setValue(Double.parseDouble(extractJsonValue(json, "value")));
        }

        if (json.contains("\"unit\":")) {
            reading.setUnit(extractJsonValue(json, "unit"));
        }

        if (json.contains("\"vehicleId\":")) {
            reading.setVehicleId(extractJsonValue(json, "vehicleId"));
        }

        if (json.contains("\"status\":")) {
            reading.setStatus(extractJsonValue(json, "status"));
        }

        reading.setTimestamp(LocalDateTime.now());

        return reading;
    }

    private String extractJsonValue(String json, String key) {
        String keyPattern = "\"" + key + "\":";
        int startIndex = json.indexOf(keyPattern) + keyPattern.length();
        int endIndex;

        if (json.charAt(startIndex) == '"') {
            startIndex++;
            endIndex = json.indexOf("\"", startIndex);
        } else {
            endIndex = json.indexOf(",", startIndex);
            if (endIndex == -1) {
                endIndex = json.indexOf("}", startIndex);
            }
        }

        return json.substring(startIndex, endIndex).trim();
    }

    private String convertToJson(List<SensorReading> readings) {
        StringBuilder json = new StringBuilder("[");

        for (int i = 0; i < readings.size(); i++) {
            SensorReading reading = readings.get(i);

            json.append("{");
            json.append("\"id\":").append(reading.getId()).append(",");
            json.append("\"sensorId\":\"").append(reading.getSensorId()).append("\",");
            json.append("\"value\":").append(reading.getValue()).append(",");
            json.append("\"unit\":\"").append(reading.getUnit()).append("\",");
            json.append("\"timestamp\":\"").append(reading.getTimestamp()).append("\",");
            json.append("\"vehicleId\":\"").append(reading.getVehicleId()).append("\",");
            json.append("\"status\":\"").append(reading.getStatus()).append("\"");
            json.append("}");

            if (i < readings.size() - 1) {
                json.append(",");
            }
        }

        json.append("]");
        return json.toString();
    }
}
