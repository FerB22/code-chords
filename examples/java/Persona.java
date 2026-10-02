package ejemplos;

public class Persona {
    protected String nombre;
    protected int edad;

    public Persona(String nombre, int edad) {
        this.nombre = nombre;
        this.edad = edad;
    }

    public String getNombre() {
        return this.nombre;
    }

    public void presentarse() {
        System.out.println("Hola, soy " + this.nombre);
    }
}
