package Digital_Notebook.student_planner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication(scanBasePackages = {"Digital_Notebook.student_planner", "com.uit.studentplanner"})
@EnableMongoRepositories("com.uit.studentplanner.repository")
public class StudentPlannerApplication {

	public static void main(String[] args) {
		SpringApplication.run(StudentPlannerApplication.class, args);
	}

}
