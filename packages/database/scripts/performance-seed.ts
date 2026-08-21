import 'dotenv/config';
import { Pool } from 'pg';
import { assertIsolatedTestDatabase, validateDatabaseUrl } from '../src/config.ts';

const count = (name: string, fallback: number) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1)
    throw new Error('Performance seed configuration is invalid');
  return value;
};

async function run(): Promise<void> {
  if (process.env.PERFORMANCE_SEED_ENABLED !== 'true' || process.env.NODE_ENV === 'production') {
    throw new Error('Performance seed is disabled');
  }
  const connectionString = validateDatabaseUrl(assertIsolatedTestDatabase(), { requireNeon: true });
  const volumes = {
    users: count('PERF_USERS', 10_000),
    categories: count('PERF_CATEGORIES', 100),
    courses: count('PERF_COURSES', 1_000),
    enrollments: count('PERF_ENROLLMENTS', 50_000),
    progress: count('PERF_PROGRESS', 500_000),
    payments: count('PERF_PAYMENTS', 50_000),
    certificates: count('PERF_CERTIFICATES', 25_000),
    notifications: count('PERF_NOTIFICATIONS', 250_000),
    logs: count('PERF_ACTIVITY_LOGS', 500_000),
    jobs: count('PERF_JOBS', 50_000),
  };
  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query("select pg_advisory_xact_lock(hashtext('joel-academy-performance-seed'))");
    const existing = await client.query<{ count: string }>(
      "select count(*)::text as count from users where email_normalized like 'perf-user-%@example.invalid'",
    );
    if (existing.rows[0]?.count !== '0') throw new Error('Performance seed data already exists');
    await client.query(
      `insert into users (email,email_normalized,password_hash,status)
      select 'perf-user-'||n||'@example.invalid','perf-user-'||n||'@example.invalid','not-a-real-password-hash','ACTIVE'
      from generate_series(1,$1) n`,
      [volumes.users],
    );
    await client.query(
      `insert into categories (name,slug) select 'Performance Category '||n,'perf-category-'||n from generate_series(1,$1) n`,
      [volumes.categories],
    );
    await client.query(
      `with u as (select id,row_number() over(order by email_normalized) rn from users where email_normalized like 'perf-user-%@example.invalid'),
      c as (select id,row_number() over(order by slug) rn from categories where slug like 'perf-category-%')
      insert into courses(category_id,created_by,title,slug,short_description,presenter_name,status,visibility,access_type,published_at)
      select c.id,u.id,'Performance Course '||n,'perf-course-'||n,'Representative searchable LMS course '||n,'Presenter '||n,'PUBLISHED','PUBLIC',case when n%2=0 then 'FREE'::course_access_type else 'PAID'::course_access_type end,now()-(n||' minutes')::interval
      from generate_series(1,$1) n join c on c.rn=((n-1)%$2)+1 join u on u.rn=((n-1)%$3)+1`,
      [volumes.courses, volumes.categories, volumes.users],
    );
    await client.query(
      `insert into course_sections(course_id,title,position) select id,'Section '||n,n from courses cross join generate_series(1,10) n where slug like 'perf-course-%'`,
    );
    await client.query(
      `insert into lessons(course_id,section_id,title,slug,position) select s.course_id,s.id,'Lesson '||n,'lesson-'||s.position||'-'||n,n from course_sections s cross join generate_series(1,3) n join courses c on c.id=s.course_id where c.slug like 'perf-course-%'`,
    );
    await client.query(
      `with u as (select id,row_number() over(order by email_normalized) rn from users where email_normalized like 'perf-user-%@example.invalid'), c as (select id,row_number() over(order by slug) rn from courses where slug like 'perf-course-%')
      insert into enrollments(student_id,course_id,status,price_at_enrollment,currency_at_enrollment)
      select u.id,c.id,'ACTIVE',0,'ETB' from generate_series(1,$1) n join u on u.rn=(floor((n-1)/$3)::int%$2)+1 join c on c.rn=((n-1)%$3)+1 on conflict(student_id,course_id) do nothing`,
      [volumes.enrollments, volumes.users, volumes.courses],
    );
    await client.query(
      `insert into lesson_progress(enrollment_id,lesson_id,status,progress_percent,last_viewed_at)
      select e.id,l.id,case when e.n%3=0 then 'COMPLETED'::progress_status else 'IN_PROGRESS'::progress_status end,case when e.n%3=0 then 100 else 50 end,now()-(e.n||' seconds')::interval
      from (select *,row_number() over(order by id) n from enrollments limit $1) e join lateral (select id from lessons where course_id=e.course_id order by position limit 10) l on true limit $2`,
      [volumes.enrollments, volumes.progress],
    );
    await client.query(
      `insert into payments(enrollment_id,attempt_number,transaction_id,amount,currency,status) select id,1,'PERF-TX-'||row_number() over(order by id),0,'ETB','PENDING' from enrollments order by id limit $1`,
      [volumes.payments],
    );
    await client.query(
      `insert into certificate_templates(name,version,configuration) values('Performance Template',1,'{}') on conflict(name,version) do nothing`,
    );
    await client.query(
      `insert into certificates(enrollment_id,template_id,certificate_number,verification_token,student_name_at_issue,course_title_at_issue,status,issued_at)
      select e.id,t.id,'PERF-CERT-'||row_number() over(order by e.id),'perf-token-'||row_number() over(order by e.id),'Performance Student','Performance Course','GENERATED',now() from enrollments e cross join certificate_templates t where t.name='Performance Template' order by e.id limit $1`,
      [volumes.certificates],
    );
    await client.query(
      `with u as (select id,row_number() over(order by email_normalized) rn from users where email_normalized like 'perf-user-%@example.invalid') insert into notifications(user_id,channel,status,title,body) select u.id,'IN_APP','SENT','Performance notification','Representative body' from generate_series(1,$1) n join u on u.rn=((n-1)%$2)+1`,
      [volumes.notifications, volumes.users],
    );
    await client.query(
      `with u as (select id,row_number() over(order by email_normalized) rn from users where email_normalized like 'perf-user-%@example.invalid') insert into activity_logs(actor_id,action,entity_type,entity_id) select u.id,'PERF_ACTION','course',gen_random_uuid() from generate_series(1,$1) n join u on u.rn=((n-1)%$2)+1`,
      [volumes.logs, volumes.users],
    );
    await client.query(
      `insert into background_jobs(job_type,status,payload,priority,scheduled_at) select 'PERF_JOB','PENDING','{}',n%10,now() from generate_series(1,$1) n`,
      [volumes.jobs],
    );
    await client.query('commit');
    process.stdout.write('Performance seed completed on the isolated test database.\n');
  } catch {
    await client.query('rollback');
    throw new Error('Performance seed failed safely');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(() => {
  process.stderr.write('Performance seed failed safely.\n');
  process.exitCode = 1;
});
