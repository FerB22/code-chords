package ejemplos;

public class Empleado extends Persona {
    private String puesto;

    public Empleado(String nombre, int edad, String puesto) {
        super(nombre, edad);
        this.puesto = puesto;
    }

    public String getPuesto() {
        return this.puesto;
    }

    @Override
    public void presentarse() {
        System.out.println("Soy " + this.nombre + ", trabajo como " + this.puesto);
    }
}
