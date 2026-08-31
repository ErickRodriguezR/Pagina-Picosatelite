#include <SPI.h>
#include <LoRa.h>
#include <Arduino_RouterBridge.h>

#define LORA_NSS 10
#define LORA_RST 9
#define LORA_DIO0 2

String leerPaquete() {
  int packetSize = LoRa.parsePacket(); // la funcion LoRa.parsePacket() verifica si llego un mensaje, si llego regresa el tamaño en bytes de ese paquete
  if (packetSize) { // cualquier numero diferente de 0 se evalua como true, asi que si el tamaño de bytes es mayor a 0, se cumplue la condicion
    String mensaje = "";
    while (LoRa.available()) { // mientras todavia alla bytes por leer
      mensaje += (char)LoRa.read(); // lee un byte y avanza al siguienete,lo convierte a char al numero ascii y lo agrega al string llamado mensaje
    }

    if (mensaje.startsWith("SAT7X:")) { // si mensaje empieza con SAT7X:
      mensaje = mensaje.substring(6); // dividimos el string, es decir nos quedamos solo con el indice 6 en adelante, del indice 0 al 5 lo ignoramos esos indices corresponden a SAT7X:, cambiamos el valor de String mensaje = "";
      Serial.println("Paquete recibido: ");
      Serial.println(mensaje); // imprimimos el paquete 
      Serial.print("RSSI: ");
      Serial.println(LoRa.packetRssi()); // la función LoRa.packetRssi() nos da la fuerza de la señal (RSSI) del paquete que acabas de recibir
      return mensaje; // retornamos el paquete
    } else { // si el mensaje no empieza con SAT7X: no es nuestro paquete 
      Serial.println("Paquete ignorado (no es nuestro)");
      Serial.println(mensaje);
      return ""; // retornamos una cadena vacia en caso de no ser nuestro paquete
    }
  }
  else{// si no llega un paquete retornamos una cadena vacia
    return "";
  }
  
}

void setup() {

  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0); //  Le dice a la funcion setPins cuáles pines usar para el control del chip

  if (!LoRa.begin(433E6)) { //inicializa la comunicacion SPI con la antena a 433,000,000 Hz (433E6 es notación científica: 433 × 10⁶), si da falso manda un mensaje y entra en un bucle vacio
    while (1);
  }
  LoRa.setSyncWord(0xA5);
  LoRa.enableCrc();

    /*
  LoRa.setSyncWord(0xA5); le pone un codigo seccreto a cada paquete de datos que transmitimos, si el recpetor escucha en la misma frecuencia el CHIP a nivel de hardware
  revisa:
  ¿Este paquete que llegó tiene el Sync Word 0xA5?
  Si coincide procesa el paquete, lo entrega
  Si NO coincide lo descarta automáticamente, ni siquiera nos enterariamos de que llegó

  "Aunque este no descarta por completo los paquetes que no le pertenecen, pueden seguir llegando paquetes no todos pero si algunos y algunos llegaran corruptos"

  LoRa.enableCrc();
  este es el que quita los paquetes corruptos que recibimos apartir del tamaño de datos que manda el tranmisor, asi se da cuenta de si un paquete llega corrompido

  si el receptor lo

  */

  Bridge.begin();// incializa la comunicacion entre el microcontrolador y el router, el router ya lo esta corriendo linux
  Bridge.provide("leerPaquete", leerPaquete);

  /*
  el string de provide es el nombre o identificador de la funcion, es con el que python va a llamar esa funcion, 
  el nombre sin comillas esta llamando a la funcion real, es el bloquee de instrucciones que de verdad se ejecuta
  */
}

void loop() {
  Bridge.update();
  /*
  la funcion update() hace 3 cosas:
  
  1-. revisa si llego una nueva peticion

  2-. si hay una peticion esperando ejecuta la funcion correspodiente que se registro con provide

  3-. toma el valor que esa funcion retorna, lo empaquet, y lo de vuelta por el enlace serial hacia linux
  */
}
/*
notas:

los Serial.println() del setup por alguna razon no los ejecuta o no los muestra pero si llegan al monitor serial del Arduino IDE,
pero no en el monitor serial del Arduino App Lab


*/