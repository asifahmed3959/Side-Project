#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Task
{
    /* data */
    char text[100];
};

// now i would like to make this task editor
// add tasks which are simply not in the program
int main()
{
    struct Task *tasks;
    int capacity = 2;
    tasks = malloc(capacity * sizeof(struct Task)); // initial 10 size

    if (tasks == NULL)
    {
        printf("Memory allocation failed\n");
        return 1;
    }

    int count = 0;
    int choice;

    while (1)
    {

        printf("\n1. Add Task\n");
        printf("2. View Tasks\n");
        printf("3. Exit\n");
        printf("4. To Delete Tasks \n");
        printf("Choice: ");

        scanf("%d", &choice);
        getchar();

        if (choice == 1)
        {

            char newTask[100];

            printf("Enter task: ");
            fgets(newTask, 100, stdin);

            int exists = 0;

            for (int i = 0; i < count; i++)
            {
                if (strcmp(tasks[i].text, newTask))
                {
                    exists = 1;
                    break;
                }
            }

            if (exists)
            {
                printf("Task already exist!\n");
                continue;
            }

            // check if the array is full
            if (count >= capacity)
            {
                capacity *= 2;
                struct Task *temp = realloc(tasks, capacity * sizeof(struct Task));

                if (temp == NULL)
                {
                    printf("Memory reallocation failed\n");
                    free(tasks);
                    return 1;
                }

                tasks = temp;

                printf("Task list expanded to %d tasks\n", capacity);
                /* data */
            }
            
            strcpy(tasks[count].text, newTask);
            count++;
        }
        else if (choice == 2)
        {
            for (int i = 0; i < count; i++)
            {
                printf("%d. %s", i + 1, tasks[i].text);
            }
        }
        else if (choice==4){

            if (count == 0){
                printf("No Tasks to complete\n");
                continue;
            }

            int taskNumber;

            printf("Enter task number to complete: ");
            scanf("%d", &taskNumber);
            getchar();

            if (taskNumber < 1 || taskNumber > count){
                printf("Invalid task number");
                continue;
            }

            for(int i=taskNumber-1; i < count-1; i++){
                tasks[i] = tasks[i+1];
            }
            count--;
        }
        else if (choice == 3)
        {
            break;
        }
    }

    free(tasks);
    return 0;
}