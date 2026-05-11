package Digital_Notebook.student_planner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"Digital_Notebook.student_planner", "com.uit.studentplanner"})
@EntityScan("com.uit.studentplanner.entity")
@EnableJpaRepositories("com.uit.studentplanner.repository")
public class StudentPlannerApplication {

	public static void main(String[] args) {
		SpringApplication.run(StudentPlannerApplication.class, args);
	}

}
