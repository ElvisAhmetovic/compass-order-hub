import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get today's date in Europe/Berlin timezone
    const now = new Date()
    const berlinFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const todayBerlin = berlinFormatter.format(now) // YYYY-MM-DD

    // Check if today is a weekday
    const todayDate = new Date(todayBerlin + 'T12:00:00')
    const dow = todayDate.getDay()
    if (dow === 0 || dow === 6) {
      return new Response(JSON.stringify({ message: 'Weekend, skipping' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get all admin/agent users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'agent'])

    if (usersError) throw usersError
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: 'No users found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const todayStart = todayBerlin + 'T00:00:00+01:00'
    const todayEnd = todayBerlin + 'T23:59:59+01:00'

    let markedCount = 0

    for (const user of users) {
      // Check if work_hours row already exists with start_time (manually filled)
      const { data: existingEntry } = await supabase
        .from('work_hours')
        .select('start_time')
        .eq('user_id', user.id)
        .eq('date', todayBerlin)
        .maybeSingle()

      if (existingEntry?.start_time) continue // Already has logged hours

      // Check activity in team_activities
      const { count: activityCount } = await supabase
        .from('team_activities')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)

      if (activityCount && activityCount > 0) continue

      // Check activity in order_audit_logs
      const { count: auditCount } = await supabase
        .from('order_audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('actor_id', user.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)

      if (auditCount && auditCount > 0) continue

      // Check activity in messages
      const { count: msgCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', user.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)

      if (msgCount && msgCount > 0) continue

      // No activity found — mark as absent
      await supabase
        .from('work_hours')
        .upsert(
          {
            user_id: user.id,
            date: todayBerlin,
            absent: true,
            start_time: null,
            break_time: null,
            working_hours: null,
            end_time: null,
            note: null,
          },
          { onConflict: 'user_id,date' }
        )

      markedCount++
    }

    return new Response(
      JSON.stringify({ message: `Checked ${users.length} users, marked ${markedCount} absent` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
