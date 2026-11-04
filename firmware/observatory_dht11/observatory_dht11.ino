// Standalone example: only for a verified 3.3V DHT11 module with DATA pulled up to 3.3V.
// Arduino Library Manager: "DHT sensor library" by Adafruit and Adafruit Unified Sensor.
#include <DHT.h>
constexpr uint8_t DATA_PIN = 4;
DHT sensor(DATA_PIN, DHT11);
void setup() {
  Serial.begin(115200);
  sensor.begin();
  Serial.println("# DHT11 ready; DATA=GPIO4; interval=2000ms");
}
void loop() {
  delay(2000);
  float humidity = sensor.readHumidity();
  float temperature = sensor.readTemperature();
  if (isnan(temperature) || isnan(humidity))
    Serial.println("{\"type\":\"dht11\",\"temperature\":null,\"humidity\":null,\"valid\":false}");
  else Serial.printf("{\"type\":\"dht11\",\"temperature\":%.1f,\"humidity\":%.1f,\"valid\":true}\n",temperature,humidity);
}
