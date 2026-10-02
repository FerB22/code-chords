package ejemplos;

public class Main {
    public static void main(String[] args) {
        Empleado emp = new Empleado("Carlos", 28, "Desarrollador");
        emp.presentarse();
        String nombre = emp.getNombre();
        System.out.println("Nombre obtenido: " + nombre);
    }
}
